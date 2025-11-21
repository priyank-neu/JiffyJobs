import prisma from '../src/config/database';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

async function createTestUsers() {
  try {
    console.log('Creating test users...');

    // Hash passwords
    const passwordHash = await bcrypt.hash('test123', 10);
    const adminPasswordHash = await bcrypt.hash('admin123', 10);

    // Create regular test user
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {
        passwordHash,
        name: 'Test User',
        role: UserRole.POSTER,
        isVerified: true,
      },
      create: {
        email: 'test@example.com',
        passwordHash,
        name: 'Test User',
        role: UserRole.POSTER,
        isVerified: true,
      },
    });

    console.log('✅ Test User created:');
    console.log('   Email: test@example.com');
    console.log('   Password: test123');
    console.log('   User ID:', testUser.userId);

    // Create admin test user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        passwordHash: adminPasswordHash,
        name: 'Admin User',
        role: UserRole.ADMIN,
        isVerified: true,
      },
      create: {
        email: 'admin@example.com',
        passwordHash: adminPasswordHash,
        name: 'Admin User',
        role: UserRole.ADMIN,
        isVerified: true,
      },
    });

    console.log('\n✅ Admin User created:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('   User ID:', adminUser.userId);
    console.log('   Role: ADMIN');

    // Create helper test user
    const helperUser = await prisma.user.upsert({
      where: { email: 'helper@example.com' },
      update: {
        passwordHash,
        name: 'Helper User',
        role: UserRole.HELPER,
        isVerified: true,
      },
      create: {
        email: 'helper@example.com',
        passwordHash,
        name: 'Helper User',
        role: UserRole.HELPER,
        isVerified: true,
      },
    });

    console.log('\n✅ Helper User created:');
    console.log('   Email: helper@example.com');
    console.log('   Password: test123');
    console.log('   User ID:', helperUser.userId);

    console.log('\n✨ All test users created successfully!');
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();

