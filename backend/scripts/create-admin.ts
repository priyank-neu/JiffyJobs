/**
 * Production script to create or update an admin user
 * Usage:
 *   - Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables
 *   - Or pass them as command line arguments: npm run create-admin -- email@example.com password123
 * 
 * This script is idempotent - it will update an existing user to admin if they exist,
 * or create a new admin user if they don't.
 */

import prisma from '../src/config/database';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

async function createAdmin() {
  try {
    // Get admin credentials from environment variables or command line args
    const adminEmail = process.argv[2] || process.env.ADMIN_EMAIL;
    const adminPassword = process.argv[3] || process.env.ADMIN_PASSWORD;
    const adminName = process.argv[4] || process.env.ADMIN_NAME || 'Admin User';

    if (!adminEmail || !adminPassword) {
      console.error('❌ Error: Admin email and password are required!');
      console.error('');
      console.error('Usage options:');
      console.error('  1. Set environment variables:');
      console.error('     ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=securepassword npm run create-admin');
      console.error('');
      console.error('  2. Pass as arguments:');
      console.error('     npm run create-admin -- admin@example.com securepassword "Admin Name"');
      console.error('');
      console.error('  3. On Render (via Shell):');
      console.error('     ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=securepassword npm run create-admin');
      process.exit(1);
    }

    console.log('🔐 Creating admin user...');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Name: ${adminName}`);

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
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

