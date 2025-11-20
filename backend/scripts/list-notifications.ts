/**
 * Script to list all notifications for a user
 * Usage: npx ts-node scripts/list-notifications.ts [userId]
 */

import prisma from '../src/config/database';

const userId = process.argv[2];

async function listNotifications() {
  try {
    if (userId) {
      // List notifications for specific user
      const user = await prisma.user.findUnique({
        where: { userId },
        select: { email: true, name: true },
      });

      if (!user) {
        console.error(`❌ User with ID "${userId}" not found`);
        process.exit(1);
      }

      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      console.log(`\n📬 Notifications for ${user.name || user.email}:\n`);

      if (notifications.length === 0) {
        console.log('   No notifications found.');
      } else {
        notifications.forEach((notif, index) => {
          console.log(`${index + 1}. [${notif.isRead ? 'READ' : 'UNREAD'}] ${notif.title}`);
          console.log(`   Type: ${notif.type}`);
          console.log(`   Message: ${notif.message}`);
          console.log(`   Created: ${notif.createdAt.toLocaleString()}`);
          console.log('');
        });
      }
    } else {
      // List all notifications
      const notifications = await prisma.notification.findMany({
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      console.log('\n📬 All notifications:\n');

      if (notifications.length === 0) {
        console.log('   No notifications found in the database.');
      } else {
        notifications.forEach((notif, index) => {
          console.log(`${index + 1}. [${notif.isRead ? 'READ' : 'UNREAD'}] ${notif.title}`);
          console.log(`   User: ${notif.user.name || notif.user.email}`);
          console.log(`   Type: ${notif.type}`);
          console.log(`   Message: ${notif.message}`);
          console.log(`   Created: ${notif.createdAt.toLocaleString()}`);
          console.log('');
        });
      }
    }
  } catch (error: any) {
    console.error('Error listing notifications:', error.message);
    process.exit(1);
  }
}

listNotifications();


