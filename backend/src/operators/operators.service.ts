import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, like, or, and, count, sql, SQL } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DATABASE } from '../database/database.module';
import {
  operators,
  users,
  roles,
  clients,
  operations,
} from '../database/schema';
import type { NewOperator } from '../database/schema';

@Injectable()
export class OperatorsService {
  constructor(@Inject(DATABASE) private db: MySql2Database) {}

  /**
   * Find all operators with filtering and pagination
   */
  async findAll(params: {
    search?: string;
    status?: boolean;
    super?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: SQL[] = [];

    if (params.search) {
      const searchCondition = or(
        like(operators.name, `%${params.search}%`),
        like(operators.rut, `%${params.search}%`),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (params.status !== undefined) {
      conditions.push(eq(operators.status, params.status));
    }

    if (params.super !== undefined) {
      conditions.push(eq(operators.super, params.super));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(operators)
      .where(whereClause);

    // Get paginated data
    const data = await this.db
      .select()
      .from(operators)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${operators.createdAt} DESC`);

    return {
      data,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }

  /**
   * Find operator by ID
   */
  async findById(id: number) {
    const [operator] = await this.db
      .select()
      .from(operators)
      .where(eq(operators.id, id));

    if (!operator) {
      throw new NotFoundException(`Operator with ID ${id} not found`);
    }

    return operator;
  }

  /**
   * Create a new operator
   */
  async create(operatorData: NewOperator) {
    // Check if RUT already exists (if provided)
    if (operatorData.rut) {
      const [existing] = await this.db
        .select()
        .from(operators)
        .where(eq(operators.rut, operatorData.rut));

      if (existing) {
        throw new BadRequestException(
          `Operator with RUT ${operatorData.rut} already exists`,
        );
      }
    }

    const [insertedOperator] = await this.db
      .insert(operators)
      .values(operatorData)
      .$returningId();

    return this.findById(insertedOperator.id);
  }

  /**
   * Update operator
   */
  async update(id: number, operatorData: Partial<NewOperator>) {
    // Check if operator exists
    await this.findById(id);

    // If updating RUT, check for duplicates
    if (operatorData.rut) {
      const [existing] = await this.db
        .select()
        .from(operators)
        .where(
          and(
            eq(operators.rut, operatorData.rut),
            sql`${operators.id} != ${id}`,
          ),
        );

      if (existing) {
        throw new BadRequestException(
          `Operator with RUT ${operatorData.rut} already exists`,
        );
      }
    }

    await this.db
      .update(operators)
      .set(operatorData)
      .where(eq(operators.id, id));

    return this.findById(id);
  }

  /**
   * Delete operator (soft delete by setting status to false)
   */
  async delete(id: number): Promise<void> {
    // Check if operator exists
    await this.findById(id);

    // Check if operator has active users
    const [{ userCount }] = await this.db
      .select({ userCount: count() })
      .from(users)
      .where(and(eq(users.operatorId, id), eq(users.status, true)));

    if (Number(userCount) > 0) {
      throw new BadRequestException(
        `Cannot delete operator with ${userCount} active users. Please deactivate users first.`,
      );
    }

    // Soft delete by setting status to false
    await this.db
      .update(operators)
      .set({ status: false })
      .where(eq(operators.id, id));
  }

  /**
   * Get operator statistics
   */
  async getStatistics(id: number) {
    // Verify operator exists
    await this.findById(id);

    // Get user statistics
    const [usersStats] = await this.db
      .select({
        totalUsers: count(),
        activeUsers: sql<number>`SUM(CASE WHEN ${users.status} = true THEN 1 ELSE 0 END)`,
      })
      .from(users)
      .where(eq(users.operatorId, id));

    // Get roles count
    const [rolesStats] = await this.db
      .select({ totalRoles: count() })
      .from(roles)
      .where(eq(roles.operatorId, id));

    // Get clients count
    const [clientsStats] = await this.db
      .select({ totalClients: count() })
      .from(clients)
      .where(eq(clients.operatorId, id));

    // Get operations count
    const [operationsStats] = await this.db
      .select({ totalOperations: count() })
      .from(operations)
      .where(eq(operations.operatorId, id));

    return {
      totalUsers: Number(usersStats?.totalUsers || 0),
      activeUsers: Number(usersStats?.activeUsers || 0),
      totalRoles: Number(rolesStats?.totalRoles || 0),
      totalClients: Number(clientsStats?.totalClients || 0),
      totalOperations: Number(operationsStats?.totalOperations || 0),
    };
  }
}
