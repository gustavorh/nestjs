import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, like, or, count, sql, SQL } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DATABASE } from '../database/database.module';
import { users, operators, roles, NewUser } from '../database/schema';

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE) private db: MySql2Database) {}

  /**
   * Find all users with their operator and role information
   * Optionally filter by operatorId for tenant isolation
   */
  async findAll(params: {
    operatorId?: number;
    search?: string;
    roleId?: number;
    status?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: SQL[] = [];

    if (params.operatorId !== undefined) {
      conditions.push(eq(users.operatorId, params.operatorId));
    }

    if (params.search) {
      const searchCondition = or(
        like(users.username, `%${params.search}%`),
        like(users.email, `%${params.search}%`),
        like(users.firstName, `%${params.search}%`),
        like(users.lastName, `%${params.search}%`),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (params.roleId !== undefined) {
      conditions.push(eq(users.roleId, params.roleId));
    }

    if (params.status !== undefined) {
      conditions.push(eq(users.status, params.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(users)
      .where(whereClause);

    // Get paginated data
    const data = await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        status: users.status,
        lastActivityAt: users.lastActivityAt,
        operatorId: users.operatorId,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        operator: {
          id: operators.id,
          name: operators.name,
        },
        role: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(users)
      .leftJoin(operators, eq(users.operatorId, operators.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${users.createdAt} DESC`);

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
   * Find user by ID with operator and role information
   */
  async findById(id: number, operatorId?: number) {
    const conditions = operatorId
      ? and(eq(users.id, id), eq(users.operatorId, operatorId))
      : eq(users.id, id);

    const [user] = await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        operatorId: users.operatorId,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        operator: {
          id: operators.id,
          name: operators.name,
          super: operators.super,
          status: operators.status,
        },
        role: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(users)
      .leftJoin(operators, eq(users.operatorId, operators.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(conditions);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        operatorId: users.operatorId,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        operator: {
          id: operators.id,
          name: operators.name,
          super: operators.super,
          status: operators.status,
        },
        role: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(users)
      .leftJoin(operators, eq(users.operatorId, operators.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.email, email));

    return user;
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        operatorId: users.operatorId,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        operator: {
          id: operators.id,
          name: operators.name,
          super: operators.super,
          status: operators.status,
        },
        role: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(users)
      .leftJoin(operators, eq(users.operatorId, operators.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.username, username));

    return user;
  }

  /**
   * Create a new user with operator and role validation
   */
  async create(newUser: NewUser) {
    // Validate operator exists and is active
    const [operator] = await this.db
      .select()
      .from(operators)
      .where(eq(operators.id, newUser.operatorId));

    if (!operator) {
      throw new BadRequestException(
        `Operator with ID ${newUser.operatorId} not found`,
      );
    }

    if (!operator.status) {
      throw new BadRequestException(
        `Operator with ID ${newUser.operatorId} is inactive`,
      );
    }

    // Validate role exists and belongs to the operator
    const [role] = await this.db
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.id, newUser.roleId),
          eq(roles.operatorId, newUser.operatorId),
        ),
      );

    if (!role) {
      throw new BadRequestException(
        `Role with ID ${newUser.roleId} not found for operator ${newUser.operatorId}`,
      );
    }

    // Check if username already exists
    const [existingUsername] = await this.db
      .select()
      .from(users)
      .where(eq(users.username, newUser.username));

    if (existingUsername) {
      throw new BadRequestException(
        `Username "${newUser.username}" already exists`,
      );
    }

    // Check if email already exists
    const [existingEmail] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, newUser.email));

    if (existingEmail) {
      throw new BadRequestException(`Email "${newUser.email}" already exists`);
    }

    const [insertedUser] = await this.db
      .insert(users)
      .values(newUser)
      .$returningId();

    return this.findById(insertedUser.id);
  }

  /**
   * Update user with tenant isolation
   */
  async update(id: number, userData: Partial<NewUser>, operatorId?: number) {
    // Check if user exists and belongs to operator (if provided)
    const existingUser = await this.findById(id, operatorId);

    // If roleId is being updated, validate it belongs to the user's operator
    if (userData.roleId) {
      const [role] = await this.db
        .select()
        .from(roles)
        .where(
          and(
            eq(roles.id, userData.roleId),
            eq(roles.operatorId, existingUser.operatorId),
          ),
        );

      if (!role) {
        throw new BadRequestException(
          `Role with ID ${userData.roleId} not found for operator ${existingUser.operatorId}`,
        );
      }
    }

    // Prevent changing operatorId (users can't switch operators)
    if (
      userData.operatorId &&
      userData.operatorId !== existingUser.operatorId
    ) {
      throw new ForbiddenException('Cannot change user operator');
    }

    const conditions = operatorId
      ? and(eq(users.id, id), eq(users.operatorId, operatorId))
      : eq(users.id, id);

    await this.db.update(users).set(userData).where(conditions);

    return this.findById(id, operatorId);
  }

  /**
   * Delete user with tenant isolation
   */
  async delete(id: number, operatorId?: number): Promise<void> {
    // Check if user exists and belongs to operator
    await this.findById(id, operatorId);

    const conditions = operatorId
      ? and(eq(users.id, id), eq(users.operatorId, operatorId))
      : eq(users.id, id);

    await this.db.delete(users).where(conditions);
  }

  /**
   * Update user's last activity timestamp
   */
  async updateLastActivity(userId: number): Promise<void> {
    await this.db
      .update(users)
      .set({ lastActivityAt: new Date() })
      .where(eq(users.id, userId));
  }
}
