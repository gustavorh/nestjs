import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq, and } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DATABASE } from '../../database/database.module';
import { roleGrants, grants } from '../../database/schema';

export const REQUIRE_PERMISSION = 'requirePermission';

export interface PermissionMetadata {
  resource: string;
  action: string;
}

interface RequestWithUser {
  user?: {
    id: number;
    roleId: number;
    operatorId: number;
    isSuper: boolean;
  };
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(DATABASE) private db: MySql2Database,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<PermissionMetadata>(
      REQUIRE_PERMISSION,
      context.getHandler(),
    );

    // If no permission is required, allow access
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // User must be authenticated
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Super operators bypass all permission checks
    if (user.isSuper) {
      return true;
    }

    // Check if user's role has the required grant
    const [grantRecord] = await this.db
      .select({
        id: grants.id,
        resource: grants.resource,
        action: grants.action,
      })
      .from(roleGrants)
      .innerJoin(grants, eq(roleGrants.grantId, grants.id))
      .where(
        and(
          eq(roleGrants.roleId, user.roleId),
          eq(grants.resource, requiredPermission.resource),
          eq(grants.action, requiredPermission.action),
        ),
      )
      .limit(1);

    if (!grantRecord) {
      throw new ForbiddenException(
        `Missing permission: ${requiredPermission.resource}:${requiredPermission.action}`,
      );
    }

    return true;
  }
}
