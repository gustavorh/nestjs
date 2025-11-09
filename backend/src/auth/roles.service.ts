import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, like, and, count, sql, SQL } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DATABASE } from '../database/database.module';
import {
  roles,
  operators,
  grants,
  roleGrants,
  users,
} from '../database/schema';
import type { NewRole, NewRoleGrant } from '../database/schema';

@Injectable()
export class RolesService {
  constructor(@Inject(DATABASE) private db: MySql2Database) {}

  /**
   * Find all roles with filtering and pagination
   */
  async findAll(params: {
    operatorId?: number;
    search?: string;
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
      conditions.push(eq(roles.operatorId, params.operatorId));
    }

    if (params.search) {
      conditions.push(like(roles.name, `%${params.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(roles)
      .where(whereClause);

    // Get paginated data with operator info
    const data = await this.db
      .select({
        id: roles.id,
        name: roles.name,
        operatorId: roles.operatorId,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
        operator: {
          id: operators.id,
          name: operators.name,
        },
      })
      .from(roles)
      .leftJoin(operators, eq(roles.operatorId, operators.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${roles.createdAt} DESC`);

    // Enrich with permissions and additional data
    const enrichedData = await Promise.all(
      data.map(async (role) => {
        // Get permissions for this role
        const rolePermissions = await this.db
          .select({
            resource: grants.resource,
            action: grants.action,
          })
          .from(roleGrants)
          .leftJoin(grants, eq(roleGrants.grantId, grants.id))
          .where(eq(roleGrants.roleId, role.id));

        // Format permissions as "resource.action"
        const permissions = rolePermissions.map(
          (p) => `${p.resource}.${p.action}`,
        );

        // Check if it's a system role (you can define this logic)
        const isSystemRole =
          role.name === 'Admin' || role.name === 'SuperAdmin';

        // Get user count for this role
        const [{ userCount }] = await this.db
          .select({ userCount: count() })
          .from(users)
          .where(eq(users.roleId, role.id));

        // Check if any user with this role is active to determine status
        const [{ activeCount }] = await this.db
          .select({ activeCount: count() })
          .from(users)
          .where(and(eq(users.roleId, role.id), eq(users.status, true)));

        return {
          ...role,
          permissions,
          isSystemRole,
          status: Number(activeCount) > 0 || Number(userCount) === 0, // Active if has active users or no users
          userCount: Number(userCount),
        };
      }),
    );

    return {
      data: enrichedData,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }

  /**
   * Find role by ID with permissions
   */
  async findById(id: number, operatorId?: number) {
    const conditions = operatorId
      ? and(eq(roles.id, id), eq(roles.operatorId, operatorId))
      : eq(roles.id, id);

    const [role] = await this.db
      .select({
        id: roles.id,
        name: roles.name,
        operatorId: roles.operatorId,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
        operator: {
          id: operators.id,
          name: operators.name,
        },
      })
      .from(roles)
      .leftJoin(operators, eq(roles.operatorId, operators.id))
      .where(conditions);

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Get permissions
    const rolePermissions = await this.db
      .select({
        resource: grants.resource,
        action: grants.action,
      })
      .from(roleGrants)
      .leftJoin(grants, eq(roleGrants.grantId, grants.id))
      .where(eq(roleGrants.roleId, role.id));

    const permissions = rolePermissions.map((p) => `${p.resource}.${p.action}`);

    return {
      ...role,
      permissions,
    };
  }

  /**
   * Create a new role with permissions
   */
  async create(roleData: NewRole & { permissions?: string[] }) {
    // Validate operator exists and is active
    const [operator] = await this.db
      .select()
      .from(operators)
      .where(eq(operators.id, roleData.operatorId));

    if (!operator) {
      throw new BadRequestException(
        `Operator with ID ${roleData.operatorId} not found`,
      );
    }

    if (!operator.status) {
      throw new BadRequestException(
        `Operator with ID ${roleData.operatorId} is inactive`,
      );
    }

    // Check if role name already exists for this operator
    const [existingRole] = await this.db
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.name, roleData.name),
          eq(roles.operatorId, roleData.operatorId),
        ),
      );

    if (existingRole) {
      throw new BadRequestException(
        `Role with name "${roleData.name}" already exists for this operator`,
      );
    }

    // Create role
    const [insertedRole] = await this.db
      .insert(roles)
      .values({
        name: roleData.name,
        operatorId: roleData.operatorId,
      })
      .$returningId();

    // Handle permissions if provided
    if (roleData.permissions && roleData.permissions.length > 0) {
      await this.updateRolePermissions(insertedRole.id, roleData.permissions);
    }

    return this.findById(insertedRole.id);
  }

  /**
   * Update role and optionally its permissions
   */
  async update(
    id: number,
    roleData: Partial<NewRole> & { permissions?: string[] },
    operatorId?: number,
  ) {
    // Check if role exists
    const existingRole = await this.findById(id, operatorId);

    // Check if new name conflicts with existing role
    if (roleData.name) {
      const [conflictingRole] = await this.db
        .select()
        .from(roles)
        .where(
          and(
            eq(roles.name, roleData.name),
            eq(roles.operatorId, existingRole.operatorId),
            sql`${roles.id} != ${id}`,
          ),
        );

      if (conflictingRole) {
        throw new BadRequestException(
          `Role with name "${roleData.name}" already exists for this operator`,
        );
      }
    }

    // Update role if name is provided
    if (roleData.name) {
      await this.db
        .update(roles)
        .set({ name: roleData.name })
        .where(eq(roles.id, id));
    }

    // Update permissions if provided
    if (roleData.permissions !== undefined) {
      await this.updateRolePermissions(id, roleData.permissions);
    }

    return this.findById(id, operatorId);
  }

  /**
   * Delete role
   */
  async delete(id: number, operatorId?: number): Promise<void> {
    // Check if role exists
    await this.findById(id, operatorId);

    // Check if role has users assigned
    const [{ userCount }] = await this.db
      .select({ userCount: count() })
      .from(users)
      .where(eq(users.roleId, id));

    if (Number(userCount) > 0) {
      throw new BadRequestException(
        `Cannot delete role with ${userCount} assigned users. Please reassign users first.`,
      );
    }

    // Delete role grants first (cascade should handle this but being explicit)
    await this.db.delete(roleGrants).where(eq(roleGrants.roleId, id));

    // Delete role
    const conditions = operatorId
      ? and(eq(roles.id, id), eq(roles.operatorId, operatorId))
      : eq(roles.id, id);

    await this.db.delete(roles).where(conditions);
  }

  /**
   * Update role permissions
   */
  private async updateRolePermissions(
    roleId: number,
    permissions: string[],
  ): Promise<void> {
    // Delete existing permissions
    await this.db.delete(roleGrants).where(eq(roleGrants.roleId, roleId));

    if (permissions.length === 0) {
      return;
    }

    // Parse permissions (format: "resource.action")
    const parsedPermissions = permissions.map((permission) => {
      const [resource, action] = permission.split('.');
      if (!resource || !action) {
        throw new BadRequestException(
          `Invalid permission format: ${permission}. Expected "resource.action"`,
        );
      }
      return { resource, action };
    });

    // Ensure all grants exist
    for (const { resource, action } of parsedPermissions) {
      const [existingGrant] = await this.db
        .select()
        .from(grants)
        .where(and(eq(grants.resource, resource), eq(grants.action, action)));

      if (!existingGrant) {
        // Create grant if it doesn't exist
        await this.db.insert(grants).values({ resource, action });
      }
    }

    // Get grant IDs
    const grantRecords = await Promise.all(
      parsedPermissions.map(async ({ resource, action }) => {
        const [grant] = await this.db
          .select()
          .from(grants)
          .where(and(eq(grants.resource, resource), eq(grants.action, action)));
        return grant;
      }),
    );

    // Create role grants
    const roleGrantsValues: NewRoleGrant[] = grantRecords.map((grant) => ({
      roleId,
      grantId: grant.id,
    }));

    if (roleGrantsValues.length > 0) {
      await this.db.insert(roleGrants).values(roleGrantsValues);
    }
  }
}
