import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { desc, and, eq, gte, lte, like, sql } from 'drizzle-orm';
import { DATABASE } from '../database/database.module';
import { auditLog, users, operators } from '../database/schema';

export interface AuditLogFilter {
  userId?: number;
  operatorId?: number;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface AuditLogWithRelations {
  id: number;
  userId: number;
  operatorId: number;
  action: string;
  resource: string | null;
  resourceId: number | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  } | null;
  operator: {
    id: number;
    name: string;
  } | null;
}

@Injectable()
export class AuditService {
  constructor(@Inject(DATABASE) private db: MySql2Database) {}

  async findAll(filter: AuditLogFilter = {}): Promise<{
    data: AuditLogWithRelations[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: Parameters<typeof and> = [];

    if (filter.userId) {
      conditions.push(eq(auditLog.userId, filter.userId));
    }

    if (filter.operatorId) {
      conditions.push(eq(auditLog.operatorId, filter.operatorId));
    }

    if (filter.action) {
      conditions.push(like(auditLog.action, `%${filter.action}%`));
    }

    if (filter.resource) {
      conditions.push(eq(auditLog.resource, filter.resource));
    }

    if (filter.startDate) {
      conditions.push(gte(auditLog.createdAt, filter.startDate));
    }

    if (filter.endDate) {
      conditions.push(lte(auditLog.createdAt, filter.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(whereClause);

    const total = countResult?.count || 0;

    // Get paginated data with relations
    const data = await this.db
      .select({
        id: auditLog.id,
        userId: auditLog.userId,
        operatorId: auditLog.operatorId,
        action: auditLog.action,
        resource: auditLog.resource,
        resourceId: auditLog.resourceId,
        details: auditLog.details,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        createdAt: auditLog.createdAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        operator: {
          id: operators.id,
          name: operators.name,
        },
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .leftJoin(operators, eq(auditLog.operatorId, operators.id))
      .where(whereClause)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findById(id: number): Promise<AuditLogWithRelations | null> {
    const [result] = await this.db
      .select({
        id: auditLog.id,
        userId: auditLog.userId,
        operatorId: auditLog.operatorId,
        action: auditLog.action,
        resource: auditLog.resource,
        resourceId: auditLog.resourceId,
        details: auditLog.details,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        createdAt: auditLog.createdAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        operator: {
          id: operators.id,
          name: operators.name,
        },
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .leftJoin(operators, eq(auditLog.operatorId, operators.id))
      .where(eq(auditLog.id, id))
      .limit(1);

    return result || null;
  }

  async getUserActivity(
    userId: number,
    limit = 20,
  ): Promise<AuditLogWithRelations[]> {
    return this.db
      .select({
        id: auditLog.id,
        userId: auditLog.userId,
        operatorId: auditLog.operatorId,
        action: auditLog.action,
        resource: auditLog.resource,
        resourceId: auditLog.resourceId,
        details: auditLog.details,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        createdAt: auditLog.createdAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        operator: {
          id: operators.id,
          name: operators.name,
        },
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .leftJoin(operators, eq(auditLog.operatorId, operators.id))
      .where(eq(auditLog.userId, userId))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);
  }
}
