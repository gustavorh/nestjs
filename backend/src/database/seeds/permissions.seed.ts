import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { grants, roles, roleGrants, operators } from '../schema';

/**
 * Seeds the database with default permissions (grants) and roles
 * This should be run after the initial migration
 */
export async function seedPermissions(db: MySql2Database): Promise<void> {
  console.log('🌱 Starting permissions seed...');

  try {
    // ========================================================================
    // 1. CREATE GRANTS (Universal permissions across all operators)
    // ========================================================================
    console.log('📝 Creating grants...');

    const grantsList = [
      // Users management
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'delete' },

      // Orders management
      { resource: 'orders', action: 'create' },
      { resource: 'orders', action: 'read' },
      { resource: 'orders', action: 'update' },
      { resource: 'orders', action: 'delete' },
      { resource: 'orders', action: 'close' },

      // Routes management
      { resource: 'routes', action: 'create' },
      { resource: 'routes', action: 'read' },
      { resource: 'routes', action: 'update' },
      { resource: 'routes', action: 'delete' },
      { resource: 'routes', action: 'assign' },

      // Drivers management
      { resource: 'drivers', action: 'create' },
      { resource: 'drivers', action: 'read' },
      { resource: 'drivers', action: 'update' },
      { resource: 'drivers', action: 'delete' },

      // Vehicles management
      { resource: 'vehicles', action: 'create' },
      { resource: 'vehicles', action: 'read' },
      { resource: 'vehicles', action: 'update' },
      { resource: 'vehicles', action: 'delete' },

      // Reports
      { resource: 'reports', action: 'read' },
      { resource: 'reports', action: 'export' },

      // Settings/Configuration
      { resource: 'settings', action: 'read' },
      { resource: 'settings', action: 'update' },

      // Audit logs
      { resource: 'audit', action: 'read' },

      // Roles management
      { resource: 'roles', action: 'create' },
      { resource: 'roles', action: 'read' },
      { resource: 'roles', action: 'update' },
      { resource: 'roles', action: 'delete' },
    ];

    // Insert grants and collect their IDs
    const createdGrants: Record<string, number> = {};

    for (const grant of grantsList) {
      const [existing] = await db
        .select()
        .from(grants)
        .where(
          and(
            eq(grants.resource, grant.resource),
            eq(grants.action, grant.action),
          ),
        )
        .limit(1);

      if (!existing) {
        const [inserted] = await db.insert(grants).values(grant).$returningId();
        createdGrants[`${grant.resource}:${grant.action}`] = inserted.id;
      } else {
        createdGrants[`${grant.resource}:${grant.action}`] = existing.id;
      }
    }

    console.log(`✅ Created ${Object.keys(createdGrants).length} grants`);

    // ========================================================================
    // 2. GET OR CREATE DEFAULT OPERATOR
    // ========================================================================
    console.log('🏢 Setting up default operator...');

    let defaultOperator = await db.select().from(operators).limit(1);

    if (defaultOperator.length === 0) {
      console.log('⚠️  No operator found. Creating default operator...');
      const [newOperator] = await db
        .insert(operators)
        .values({
          name: 'Default Operator',
          rut: '12345678-9',
          super: false,
          status: true,
        })
        .$returningId();

      const [operator] = await db
        .select()
        .from(operators)
        .where(eq(operators.id, newOperator.id));

      defaultOperator = [operator];
    }

    const operatorId = defaultOperator[0].id;
    console.log(
      `✅ Using operator: ${defaultOperator[0].name} (ID: ${operatorId})`,
    );

    // ========================================================================
    // 3. CREATE PREDEFINED ROLES
    // ========================================================================
    console.log('👥 Creating predefined roles...');

    const rolesData = [
      {
        name: 'Administrador',
        description: 'Acceso completo a todos los módulos y configuraciones',
        permissions: Object.keys(createdGrants), // All permissions
      },
      {
        name: 'Supervisor',
        description:
          'Control y seguimiento de operaciones, con capacidad de edición',
        permissions: Object.keys(createdGrants).filter(
          (key) => !key.includes('users:delete') && !key.includes('roles:'),
        ),
      },
      {
        name: 'Operador',
        description:
          'Ingreso de programación, monitoreo y cierre de operaciones',
        permissions: [
          'orders:create',
          'orders:read',
          'orders:update',
          'orders:close',
          'routes:create',
          'routes:read',
          'routes:update',
          'routes:assign',
          'drivers:read',
          'vehicles:read',
          'reports:read',
        ],
      },
      {
        name: 'Chofer',
        description:
          'Acceso limitado para ejecución en terreno (App BeeTracer)',
        permissions: [
          'routes:read',
          'routes:update',
          'orders:read',
          'orders:update',
        ],
      },
    ];

    for (const roleData of rolesData) {
      // Check if role already exists
      const [existingRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, roleData.name))
        .limit(1);

      let roleId: number;

      if (existingRole) {
        console.log(
          `  ⏭️  Role "${roleData.name}" already exists, skipping...`,
        );
        roleId = existingRole.id;
      } else {
        const [newRole] = await db
          .insert(roles)
          .values({
            name: roleData.name,
            operatorId,
          })
          .$returningId();

        roleId = newRole.id;
        console.log(`  ✅ Created role: ${roleData.name}`);
      }

      // Assign permissions to role
      const permissionsToInsert = roleData.permissions
        .filter((permKey) => createdGrants[permKey])
        .map((permKey) => ({
          roleId,
          grantId: createdGrants[permKey],
        }));

      if (permissionsToInsert.length > 0) {
        // Delete existing permissions first to avoid duplicates
        await db.delete(roleGrants).where(eq(roleGrants.roleId, roleId));

        await db.insert(roleGrants).values(permissionsToInsert);
        console.log(
          `  📋 Assigned ${permissionsToInsert.length} permissions to "${roleData.name}"`,
        );
      }
    }

    console.log('✅ Permissions seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  }
}

/**
 * Example usage:
 *
 * import { drizzle } from 'drizzle-orm/mysql2';
 * import mysql from 'mysql2/promise';
 * import { seedPermissions } from './seeds/permissions.seed';
 *
 * const connection = await mysql.createConnection({
 *   host: 'localhost',
 *   user: 'root',
 *   password: 'password',
 *   database: 'mydb'
 * });
 *
 * const db = drizzle(connection);
 * await seedPermissions(db);
 * await connection.end();
 */
