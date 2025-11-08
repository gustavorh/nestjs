#!/usr/bin/env tsx

/**
 * Script to run all database seeds
 *
 * Usage:
 *   npm run seed
 *   or
 *   tsx src/database/seeds/run-seed.ts
 *
 * Options:
 *   --sample    Include sample data (drivers, vehicles, operations)
 *   --no-sample Skip sample data (only default operator, roles, user, permissions)
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { seedPermissions } from './permissions.seed';
import { seedDefaultUser } from './default-user.seed';
import { seedSampleData } from './sample-data.seed';

dotenv.config();

async function main() {
  console.log('🚀 Starting seed process...\n');

  // Check command line arguments
  const args = process.argv.slice(2);
  const includeSampleData = !args.includes('--no-sample');

  // Create database connection
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'fullstack_db',
  });

  console.log('✅ Database connection established\n');

  const db = drizzle(connection);

  try {
    // 1. Seed operator, permissions, and roles
    await seedPermissions(db);

    // 2. Seed default admin user
    await seedDefaultUser(db);

    // 3. Optionally seed sample data
    if (includeSampleData) {
      console.log('');
      await seedSampleData(db);
    } else {
      console.log(
        '\n⏭️  Skipping sample data (use without --no-sample to include)',
      );
    }

    console.log('\n🎉 All seeds completed successfully!');
    console.log('\n📝 Default Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: A12345678');
    console.log('   Email: admin@gustavorh.com');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
    console.log('\n👋 Database connection closed');
  }
}

void main();
