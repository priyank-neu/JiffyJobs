/**
 * Test script to create a notification for testing
 * Usage: npx ts-node scripts/test-notification.ts <userId> [type] [title] [message]
 * 
 * Example:
 *   npx ts-node scripts/test-notification.ts <your-user-id> NEW_MESSAGE "Test Notification" "This is a test message"
 */

import prisma from '../src/config/database';
import { NotificationType } from '@prisma/client';

const userId = process.argv[2];
const type = (process.argv[3] || 'NEW_MESSAGE') as NotificationType;
const title = process.argv[4] || 'Test Notification';
const message = process.argv[5] || 'This is a test notification to verify the notification system is working.';

if (!userId) {
  console.error('❌ Error: User ID is required');
  console.log('\nUsage:');
  console.log('  npx ts-node scripts/test-notification.ts <userId> [type] [title] [message]');
  console.log('\nExample:');
  console.log('  npx ts-node scripts/test-notification.ts abc123 NEW_MESSAGE "Test" "Hello World"');
  console.log('\nTo find your user ID:');
  console.log('  1. Log in to the app');
  console.log('  2. Open browser console');
  console.log('  3. Run: JSON.parse(localStorage.getItem("user")).userId');
  process.exit(1);
}

async function createTestNotification() {
  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true, email: true, name: true },
    });

    if (!user) {
      console.error(`❌ Error: User with ID "${userId}" not found`);
      process.exit(1);
    }

    console.log(`\n📧 Creating notification for user: ${user.name || user.email} (${userId})`);

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        isRead: false,
      },
    });

    console.log('\n✅ Notification created successfully!');
    console.log('\n📋 Notification Details:');
    console.log(`   ID: ${notification.notificationId}`);
    console.log(`   Type: ${notification.type}`);
    console.log(`   Title: ${notification.title}`);
    console.log(`   Message: ${notification.message}`);
    console.log(`   Created: ${notification.createdAt}`);
    console.log(`   Read: ${notification.isRead ? 'Yes' : 'No'}`);

    console.log('\n💡 Next steps:');
    console.log('   1. Refresh your browser');
    console.log('   2. Click the notification bell icon in the navbar');
    console.log('   3. You should see the notification in the notification center');
    console.log('   4. If Socket.IO is connected, you should also see a toast notification');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error creating notification:', error.message);
    if (error.code === 'P2003') {
      console.error('   This usually means the user ID is invalid');
    }
    process.exit(1);
  }
}

createTestNotification();


