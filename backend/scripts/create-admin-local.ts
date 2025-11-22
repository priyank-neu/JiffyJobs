/**
 * Script to create admin user from your local machine
 * This connects to the production database using DATABASE_URL
 * 
 * Usage:
 *   1. Set DATABASE_URL environment variable to your production database
 *   2. Run: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=password123 npm run create-admin-local
 * 
 * Or set everything in .env file:
 *   DATABASE_URL=postgresql://user:password@host:port/database
 *   ADMIN_EMAIL=admin@example.com
 *   ADMIN_PASSWORD=securepassword123
 */

import prisma from '../src/config/database';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createAdmin() {
  try {
    // Get admin credentials from environment variables or command line args
    const adminEmail = process.argv[2] || process.env.ADMIN_EMAIL;
    const adminPassword = process.argv[3] || process.env.ADMIN_PASSWORD;
    const adminName = process.argv[4] || process.env.ADMIN_NAME || 'Admin User';
    
    // Check DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('❌ Error: DATABASE_URL environment variable is required!');
      console.error('');
      console.error('Usage:');
      console.error('  Option 1: Set in .env file:');
      console.error('    DATABASE_URL=postgresql://user:pass@host:port/db');
      console.error('    ADMIN_EMAIL=admin@example.com');
      console.error('    ADMIN_PASSWORD=securepassword');
      console.error('    npm run create-admin-local');
      console.error('');
      console.error('  Option 2: Set as environment variables:');
      console.error('    DATABASE_URL=postgresql://... ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=pass npm run create-admin-local');
      console.error('');
      console.error('  Option 3: Pass as arguments:');
      console.error('    DATABASE_URL=postgresql://... npm run create-admin-local -- admin@example.com password123 "Admin Name"');
      process.exit(1);
    }

    if (!adminEmail || !adminPassword) {
      console.error('❌ Error: Admin email and password are required!');
      console.error('');
      console.error('Usage options:');
      console.error('  1. Set environment variables in .env or export them:');
      console.error('     ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=securepassword npm run create-admin-local');
      console.error('');
      console.error('  2. Pass as arguments:');
      console.error('     npm run create-admin-local -- admin@example.com securepassword "Admin Name"');
      process.exit(1);
    }

    console.log('🔐 Creating admin user...');
    console.log(`   Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`); // Mask password
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Name: ${adminName}`);
    console.log('');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    let adminUser;

    if (existingUser) {
      // Update existing user to admin
      adminUser = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          passwordHash,
          name: adminName,
          role: UserRole.ADMIN,
          isVerified: true,
          accountStatus: 'ACTIVE',
        },
      });
      console.log('✅ Existing user updated to admin role');
    } else {
      // Create new admin user
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          name: adminName,
          role: UserRole.ADMIN,
          isVerified: true,
          accountStatus: 'ACTIVE',
        },
      });
      console.log('✅ New admin user created');
    }

    console.log('');
    console.log('✨ Admin user ready:');
    console.log(`   User ID: ${adminUser.userId}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Verified: ${adminUser.isVerified}`);
    console.log('');
    console.log('🔑 You can now log in with:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('');
    console.log('⚠️  Remember to change the password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

