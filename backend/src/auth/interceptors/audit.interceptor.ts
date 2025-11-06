import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DATABASE } from '../../database/database.module';
import { auditLog } from '../../database/schema';

interface RequestWithUser {
  user?: {
    id: number;
    operatorId: number;
    username?: string;
  };
  ip?: string;
  method: string;
  url: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(@Inject(DATABASE) private db: MySql2Database) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    const method = request.method;
    const url = request.url;

    // Only log if user is authenticated
    if (!user) {
      return next.handle();
    }

    // Skip logging for certain endpoints (e.g., health checks, audit log queries)
    if (this.shouldSkipLogging(url)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          void this.logAction(
            user,
            method,
            url,
            request.body,
            data,
            request.ip,
            request.headers?.['user-agent'] as string,
          ).catch((error) => {
            console.error('Audit logging failed:', error);
          });
        },
        error: (error: Error) => {
          void this.logAction(
            user,
            method,
            url,
            request.body,
            { error: error.message },
            request.ip,
            request.headers?.['user-agent'] as string,
          ).catch((logError) => {
            console.error('Audit logging failed:', logError);
          });
        },
      }),
    );
  }

  private shouldSkipLogging(url: string): boolean {
    const skipPatterns = ['/health', '/audit', '/auth/refresh', '/metrics'];

    return skipPatterns.some((pattern) => url.includes(pattern));
  }

  private async logAction(
    user: { id: number; operatorId: number },
    method: string,
    url: string,
    body: Record<string, unknown> | undefined,
    responseData: unknown,
    ipAddress: string | undefined,
    userAgent: string | undefined,
  ): Promise<void> {
    const resource = this.extractResource(url);
    const resourceId = this.extractResourceId(url, responseData);
    const action = this.buildActionName(method, resource);

    // Build details JSON
    const details: Record<string, unknown> = {};

    if (body && Object.keys(body).length > 0) {
      // Remove sensitive fields
      const sanitizedBody = { ...body };
      delete sanitizedBody.password;
      delete sanitizedBody.token;
      details.body = sanitizedBody;
    }

    if (resourceId) {
      details.resourceId = resourceId;
    }

    await this.db.insert(auditLog).values({
      userId: user.id,
      operatorId: user.operatorId,
      action,
      resource,
      resourceId,
      details: JSON.stringify(details).substring(0, 1000), // Limit to 1000 chars
      ipAddress: ipAddress?.substring(0, 45),
      userAgent: userAgent?.substring(0, 500),
    });
  }

  private extractResource(url: string): string | null {
    // Extract resource from URL (e.g., /api/users/123 -> 'users')
    const match = url.match(/\/(?:api\/)?([^/?]+)/);
    if (match && match[1] !== 'auth') {
      return match[1];
    }
    return null;
  }

  private extractResourceId(url: string, data: unknown): number | null {
    // Try to extract from URL path (e.g., /users/123)
    const urlMatch = url.match(/\/(\d+)(?:[/?]|$)/);
    if (urlMatch) {
      return parseInt(urlMatch[1], 10);
    }

    // Try to extract from response data
    if (data && typeof data === 'object' && 'id' in data) {
      const id = (data as { id: unknown }).id;
      if (typeof id === 'number') {
        return id;
      }
    }

    return null;
  }

  private buildActionName(method: string, resource: string | null): string {
    const actionMap: Record<string, string> = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };

    const action = actionMap[method] || method.toLowerCase();
    return resource ? `${action}_${resource}` : action;
  }
}
