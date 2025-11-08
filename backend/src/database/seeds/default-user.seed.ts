import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { users, roles, operators } from '../schema';
import * as bcrypt from 'bcrypt';

/**
 * Seeds the database with the default admin user
 */
export async function seedDefaultUser(db: MySql2Database): Promise<void> {
  console.log('👤 Starting default user seed...');

  try {
    // ========================================================================
    // 1. GET BILIX OPERATOR
    // ========================================================================
    const [bilixOperator] = await db
      .select()
      .from(operators)
      .where(eq(operators.rut, '12345678-9'))
      .limit(1);

    if (!bilixOperator) {
      throw new Error('Bilix operator not found. Run permissions seed first.');
    }

    console.log(
      `✅ Found operator: ${bilixOperator.name} (ID: ${bilixOperator.id})`,
    );

    // ========================================================================
    // 2. GET ADMINISTRADOR ROLE
    // ========================================================================
    const [adminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'Administrador'))
      .limit(1);

    if (!adminRole) {
      throw new Error(
        'Administrador role not found. Run permissions seed first.',
      );
    }

    console.log(`✅ Found role: ${adminRole.name} (ID: ${adminRole.id})`);

    // ========================================================================
    // 3. CREATE DEFAULT ADMIN USER
    // ========================================================================
    console.log('Creating default admin user...');

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);

    if (existingUser) {
      console.log('⏭️  Admin user already exists, skipping...');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('A12345678', 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        username: 'admin',
        email: 'admin@gustavorh.com',
        password: hashedPassword,
        firstName: 'Gustavo',
        lastName: 'Reyes',
        status: true,
        operatorId: bilixOperator.id,
        roleId: adminRole.id,
        createdBy: null, // System
      })
      .$returningId();

    console.log(`✅ Created admin user (ID: ${newUser.id})`);
    console.log('   Username: admin');
    console.log('   Email: admin@gustavorh.com');
    console.log('   Password: A12345678');
    console.log(`   Operator: ${bilixOperator.name}`);
    console.log(`   Role: ${adminRole.name}`);

    console.log('✅ Default user seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding default user:', error);
    throw error;
  }
}
