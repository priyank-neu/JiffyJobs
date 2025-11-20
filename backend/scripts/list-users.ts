/**
 * Script to list all users (to find your user ID)
 * Usage: npx ts-node scripts/list-users.ts
 */

import prisma from '../src/config/database';

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        userId: true,
        email: true,
        name: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    console.log('\n👥 Users in database:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No name'} (${user.email})`);
      console.log(`   User ID: ${user.userId}`);
      console.log(`   Verified: ${user.isVerified ? 'Yes' : 'No'}`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log('');
    });

    console.log('\n💡 To create a test notification, use:');
    console.log(`   npx ts-node scripts/test-notification.ts <userId>`);
    console.log(`\n   Example:`);
    console.log(`   npx ts-node scripts/test-notification.ts ${users[0].userId}`);
  } catch (error: any) {
    console.error('Error listing users:', error.message);
    process.exit(1);
  }
}

listUsers();


