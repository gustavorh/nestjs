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

      // Routes management
      { resource: 'routes', action: 'create' },
      { resource: 'routes', action: 'read' },
      { resource: 'routes', action: 'update' },
      { resource: 'routes', action: 'delete' },

      // Drivers management
      { resource: 'drivers', action: 'create' },
      { resource: 'drivers', action: 'read' },
      { resource: 'drivers', action: 'update' },
      { resource: 'drivers', action: 'delete' },
      { resource: 'drivers:documents', action: 'create' },
      { resource: 'drivers:documents', action: 'read' },
      { resource: 'drivers:documents', action: 'update' },
      { resource: 'drivers:documents', action: 'delete' },

      // Vehicles management
      { resource: 'vehicles', action: 'create' },
      { resource: 'vehicles', action: 'read' },
      { resource: 'vehicles', action: 'update' },
      { resource: 'vehicles', action: 'delete' },
      { resource: 'vehicles:documents', action: 'create' },
      { resource: 'vehicles:documents', action: 'read' },
      { resource: 'vehicles:documents', action: 'update' },
      { resource: 'vehicles:documents', action: 'delete' },
      { resource: 'vehicles:status', action: 'read' },
      { resource: 'vehicles:status', action: 'update' },
      { resource: 'vehicles:operations', action: 'read' },
      { resource: 'vehicles:stats', action: 'read' },
      { resource: 'vehicles:assignments', action: 'create' },
      { resource: 'vehicles:assignments', action: 'read' },
      { resource: 'vehicles:assignments', action: 'update' },
      { resource: 'vehicles:assignments', action: 'delete' },

      // Operations management
      { resource: 'operations', action: 'create' },
      { resource: 'operations', action: 'read' },
      { resource: 'operations', action: 'update' },
      { resource: 'operations', action: 'delete' },
      { resource: 'operations', action: 'assign' },
      { resource: 'operations', action: 'unassign' },
      { resource: 'operations:assignments', action: 'create' },
      { resource: 'operations:assignments', action: 'read' },
      { resource: 'operations:assignments', action: 'update' },
      { resource: 'operations:assignments', action: 'delete' },

      // Clients management
      { resource: 'clients', action: 'create' },
      { resource: 'clients', action: 'read' },
      { resource: 'clients', action: 'update' },
      { resource: 'clients', action: 'delete' },
      { resource: 'clients:operations', action: 'read' },
      { resource: 'clients:statistics', action: 'read' },
      { resource: 'clients:analytics', action: 'read' },

      // Providers management
      { resource: 'providers', action: 'create' },
      { resource: 'providers', action: 'read' },
      { resource: 'providers', action: 'update' },
      { resource: 'providers', action: 'delete' },
      { resource: 'providers:operations', action: 'read' },
      { resource: 'providers:statistics', action: 'read' },

      // Dashboard & Analytics
      { resource: 'dashboard', action: 'read' },
      { resource: 'analytics', action: 'read' },
      { resource: 'statistics', action: 'read' },

      // Reports
      { resource: 'reports', action: 'read' },
      { resource: 'reports', action: 'create' },
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

      // Operators management
      { resource: 'operators', action: 'create' },
      { resource: 'operators', action: 'read' },
      { resource: 'operators', action: 'update' },
      { resource: 'operators', action: 'delete' },
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
    // 2. CREATE DEFAULT OPERATOR (Bilix)
    // ========================================================================
    console.log('🏢 Setting up default operator...');

    // Check if Bilix operator already exists
    const defaultOperator = await db
      .select()
      .from(operators)
      .where(eq(operators.rut, '12345678-9'))
      .limit(1);

    let operatorId: number;

    if (defaultOperator.length === 0) {
      console.log('Creating Bilix operator...');
      const [newOperator] = await db
        .insert(operators)
        .values({
          name: 'Bilix',
          rut: '12345678-9',
          super: true,
          expiration: null,
          status: true,
          createdBy: null, // System
        })
        .$returningId();

      operatorId = newOperator.id;
      console.log(`✅ Created operator: Bilix (ID: ${operatorId})`);
    } else {
      operatorId = defaultOperator[0].id;
      console.log(
        `✅ Using existing operator: ${defaultOperator[0].name} (ID: ${operatorId})`,
      );
    }

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
          (key) =>
            !key.includes('users:delete') &&
            !key.includes('roles:delete') &&
            !key.includes('operators:delete'),
        ),
      },
      {
        name: 'Operador',
        description:
          'Ingreso de programación, monitoreo y cierre de operaciones',
        permissions: [
          'operations:create',
          'operations:read',
          'operations:update',
          'operations:assign',
          'operations:assignments:create',
          'operations:assignments:read',
          'operations:assignments:update',
          'routes:create',
          'routes:read',
          'routes:update',
          'drivers:read',
          'vehicles:read',
          'vehicles:operations:read',
          'clients:read',
          'providers:read',
          'dashboard:read',
          'reports:read',
        ],
      },
      {
        name: 'Chofer',
        description: 'Acceso limitado para ejecución en terreno',
        permissions: [
          'operations:read',
          'operations:update',
          'routes:read',
          'vehicles:read',
          'drivers:read',
        ],
      },
      {
        name: 'Visualizador',
        description: 'Solo lectura de información sin capacidad de edición',
        permissions: [
          'dashboard:read',
          'operations:read',
          'routes:read',
          'drivers:read',
          'vehicles:read',
          'clients:read',
          'providers:read',
          'statistics:read',
          'reports:read',
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
