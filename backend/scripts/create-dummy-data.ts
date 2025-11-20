/**
 * Comprehensive script to create dummy data for testing
 * Creates users, tasks, bids, chat threads, messages, and notifications
 * 
 * Usage: npx ts-node scripts/create-dummy-data.ts
 */

import prisma from '../src/config/database';
import { TaskStatus, BidStatus, NotificationType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

async function createDummyData() {
  console.log('\n🚀 Starting dummy data creation...\n');

  try {
    // Step 1: Create or get users
    console.log('👥 Step 1: Setting up users...');
    
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'alice@example.com' },
        update: {},
        create: {
          email: 'alice@example.com',
          passwordHash: '$2a$10$dummy', // Dummy hash
          name: 'Alice Johnson',
          phoneNumber: '+1234567890',
          isVerified: true,
        },
      }),
      prisma.user.upsert({
        where: { email: 'bob@example.com' },
        update: {},
        create: {
          email: 'bob@example.com',
          passwordHash: '$2a$10$dummy',
          name: 'Bob Smith',
          phoneNumber: '+1234567891',
          isVerified: true,
        },
      }),
      prisma.user.upsert({
        where: { email: 'charlie@example.com' },
        update: {},
        create: {
          email: 'charlie@example.com',
          passwordHash: '$2a$10$dummy',
          name: 'Charlie Brown',
          phoneNumber: '+1234567892',
          isVerified: true,
        },
      }),
    ]);

    console.log(`✅ Created/found ${users.length} users`);

    // Step 2: Create locations
    console.log('\n📍 Step 2: Creating locations...');
    
    const locations = await Promise.all([
      prisma.location.create({
        data: {
          latitude: 42.3398,
          longitude: -71.0892,
          address: '123 Main Street',
          city: 'Boston',
          state: 'MA',
          zipCode: '02115',
          country: 'USA',
        },
      }),
      prisma.location.create({
        data: {
          latitude: 42.3500,
          longitude: -71.0800,
          address: '456 Oak Avenue',
          city: 'Boston',
          state: 'MA',
          zipCode: '02116',
          country: 'USA',
        },
      }),
      prisma.location.create({
        data: {
          latitude: 42.3600,
          longitude: -71.0700,
          address: '789 Pine Road',
          city: 'Cambridge',
          state: 'MA',
          zipCode: '02138',
          country: 'USA',
        },
      }),
    ]);

    console.log(`✅ Created ${locations.length} locations`);

    // Step 3: Create tasks
    console.log('\n📋 Step 3: Creating tasks...');
    
    const tasks = await Promise.all([
      prisma.task.create({
        data: {
          posterId: users[0].userId, // Alice
          locationId: locations[0].locationId,
          title: 'Fix Leaky Faucet',
          description: 'Need someone to fix a leaky kitchen faucet. Should take about 1-2 hours.',
          category: 'HOME_REPAIR',
          budget: new Decimal('75.00'),
          estimatedHours: 2,
          status: TaskStatus.OPEN,
          taskDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        },
      }),
      prisma.task.create({
        data: {
          posterId: users[0].userId, // Alice
          locationId: locations[1].locationId,
          title: 'Move Furniture',
          description: 'Need help moving a couch and a few boxes to the second floor.',
          category: 'MOVING',
          budget: new Decimal('100.00'),
          estimatedHours: 3,
          status: TaskStatus.IN_BIDDING,
          taskDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.task.create({
        data: {
          posterId: users[1].userId, // Bob
          locationId: locations[2].locationId,
          title: 'Garden Cleanup',
          description: 'Need help cleaning up the backyard garden. Raking leaves and trimming bushes.',
          category: 'YARD_WORK',
          budget: new Decimal('60.00'),
          estimatedHours: 4,
          status: TaskStatus.OPEN,
          taskDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.task.create({
        data: {
          posterId: users[1].userId, // Bob
          locationId: locations[0].locationId,
          title: 'Assemble IKEA Furniture',
          description: 'Need help assembling a bookshelf and a desk from IKEA.',
          category: 'ASSEMBLY',
          budget: new Decimal('80.00'),
          estimatedHours: 3,
          status: TaskStatus.ASSIGNED,
          assignedHelperId: users[2].userId, // Charlie assigned
          taskDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    console.log(`✅ Created ${tasks.length} tasks`);

    // Step 4: Create bids
    console.log('\n💰 Step 4: Creating bids...');
    
    const bids = await Promise.all([
      // Bids on Task 1 (Fix Leaky Faucet)
      prisma.bid.create({
        data: {
          taskId: tasks[0].taskId,
          helperId: users[1].userId, // Bob bids
          amount: new Decimal('70.00'),
          note: 'I have experience with plumbing. Can do it this weekend!',
          status: BidStatus.PENDING,
        },
      }),
      prisma.bid.create({
        data: {
          taskId: tasks[0].taskId,
          helperId: users[2].userId, // Charlie bids
          amount: new Decimal('65.00'),
          note: 'Available immediately. Licensed plumber.',
          status: BidStatus.PENDING,
        },
      }),
      // Bids on Task 2 (Move Furniture)
      prisma.bid.create({
        data: {
          taskId: tasks[1].taskId,
          helperId: users[2].userId, // Charlie bids
          amount: new Decimal('90.00'),
          note: 'I can help with moving. Have a truck available.',
          status: BidStatus.PENDING,
        },
      }),
      // Bid on Task 3 (Garden Cleanup)
      prisma.bid.create({
        data: {
          taskId: tasks[2].taskId,
          helperId: users[0].userId, // Alice bids
          amount: new Decimal('55.00'),
          note: 'Love gardening! Can help with this.',
          status: BidStatus.PENDING,
        },
      }),
    ]);

    console.log(`✅ Created ${bids.length} bids`);

    // Step 5: Create chat threads
    console.log('\n💬 Step 5: Creating chat threads...');
    
    const chatThreads = await Promise.all([
      // Thread 1: Alice (poster) <-> Bob (helper) for Task 1
      prisma.chatThread.create({
        data: {
          taskId: tasks[0].taskId,
          posterId: users[0].userId, // Alice
          helperId: users[1].userId, // Bob
        },
      }),
      // Thread 2: Alice (poster) <-> Charlie (helper) for Task 2
      prisma.chatThread.create({
        data: {
          taskId: tasks[1].taskId,
          posterId: users[0].userId, // Alice
          helperId: users[2].userId, // Charlie
        },
      }),
      // Thread 3: Bob (poster) <-> Charlie (helper) for Task 4 (assigned task)
      prisma.chatThread.create({
        data: {
          taskId: tasks[3].taskId,
          posterId: users[1].userId, // Bob
          helperId: users[2].userId, // Charlie
        },
      }),
    ]);

    console.log(`✅ Created ${chatThreads.length} chat threads`);

    // Step 6: Create messages
    console.log('\n📨 Step 6: Creating messages...');
    
    const messages = [];
    
    // Messages in Thread 1 (Alice <-> Bob)
    messages.push(
      await prisma.chatMessage.create({
        data: {
          threadId: chatThreads[0].threadId,
          senderId: users[1].userId, // Bob
          receiverId: users[0].userId, // Alice
          body: 'Hi! I saw your task about the leaky faucet. I can help with that!',
        },
      }),
      await prisma.chatMessage.create({
        data: {
          threadId: chatThreads[0].threadId,
          senderId: users[0].userId, // Alice
          receiverId: users[1].userId, // Bob
          body: 'Great! When are you available?',
        },
      }),
      await prisma.chatMessage.create({
        data: {
          threadId: chatThreads[0].threadId,
          senderId: users[1].userId, // Bob
          receiverId: users[0].userId, // Alice
          body: 'I can come this Saturday afternoon. Does that work for you?',
        },
      })
    );

    // Messages in Thread 2 (Alice <-> Charlie)
    messages.push(
      await prisma.chatMessage.create({
        data: {
          threadId: chatThreads[1].threadId,
          senderId: users[2].userId, // Charlie
          receiverId: users[0].userId, // Alice
          body: 'Hello! I can help you move the furniture. I have a truck.',
        },
      }),
      await prisma.chatMessage.create({
        data: {
          threadId: chatThreads[1].threadId,
          senderId: users[0].userId, // Alice
          receiverId: users[2].userId, // Charlie
          body: 'Perfect! What time works for you?',
        },
      })
    );

    // Messages in Thread 3 (Bob <-> Charlie)
    messages.push(
      await prisma.chatMessage.create({
        data: {
          threadId: chatThreads[2].threadId,
          senderId: users[1].userId, // Bob
          receiverId: users[2].userId, // Charlie
          body: 'Thanks for accepting the task! When can you start?',
        },
      }),
      await prisma.chatMessage.create({
        data: {
          threadId: chatThreads[2].threadId,
          senderId: users[2].userId, // Charlie
          receiverId: users[1].userId, // Bob
          body: 'I can start tomorrow morning. Is 9 AM good?',
        },
      }),
      await prisma.chatMessage.create({
        data: {
          threadId: chatThreads[2].threadId,
          senderId: users[1].userId, // Bob
          receiverId: users[2].userId, // Charlie
          body: 'Perfect! See you then.',
        },
      })
    );

    console.log(`✅ Created ${messages.length} messages`);

    // Step 7: Create notifications
    console.log('\n🔔 Step 7: Creating notifications...');
    
    const notifications = await Promise.all([
      // Notifications for Alice
      prisma.notification.create({
        data: {
          userId: users[0].userId,
          type: NotificationType.NEW_MESSAGE,
          title: 'New Message',
          message: 'Bob sent you a message about "Fix Leaky Faucet"',
          relatedTaskId: tasks[0].taskId,
          relatedThreadId: chatThreads[0].threadId,
          isRead: false,
        },
      }),
      prisma.notification.create({
        data: {
          userId: users[0].userId,
          type: NotificationType.BID_ACCEPTED,
          title: 'Bid Accepted',
          message: 'Your bid on "Garden Cleanup" has been accepted!',
          relatedTaskId: tasks[2].taskId,
          isRead: false,
        },
      }),
      // Notifications for Bob
      prisma.notification.create({
        data: {
          userId: users[1].userId,
          type: NotificationType.NEW_MESSAGE,
          title: 'New Message',
          message: 'Alice sent you a message about "Fix Leaky Faucet"',
          relatedTaskId: tasks[0].taskId,
          relatedThreadId: chatThreads[0].threadId,
          isRead: true,
        },
      }),
      prisma.notification.create({
        data: {
          userId: users[1].userId,
          type: NotificationType.HELPER_ASSIGNED,
          title: 'Helper Assigned',
          message: 'Charlie has been assigned to help with "Assemble IKEA Furniture"',
          relatedTaskId: tasks[3].taskId,
          isRead: false,
        },
      }),
      // Notifications for Charlie
      prisma.notification.create({
        data: {
          userId: users[2].userId,
          type: NotificationType.NEW_MESSAGE,
          title: 'New Message',
          message: 'Bob sent you a message about "Assemble IKEA Furniture"',
          relatedTaskId: tasks[3].taskId,
          relatedThreadId: chatThreads[2].threadId,
          isRead: false,
        },
      }),
      prisma.notification.create({
        data: {
          userId: users[2].userId,
          type: NotificationType.TASK_UPDATED,
          title: 'Task Updated',
          message: 'The task "Move Furniture" has been updated',
          relatedTaskId: tasks[1].taskId,
          isRead: false,
        },
      }),
    ]);

    console.log(`✅ Created ${notifications.length} notifications`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ DUMMY DATA CREATION COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📍 Locations: ${locations.length}`);
    console.log(`   📋 Tasks: ${tasks.length}`);
    console.log(`   💰 Bids: ${bids.length}`);
    console.log(`   💬 Chat Threads: ${chatThreads.length}`);
    console.log(`   📨 Messages: ${messages.length}`);
    console.log(`   🔔 Notifications: ${notifications.length}`);

    console.log('\n📝 Test Accounts:');
    console.log(`   1. Alice Johnson (alice@example.com)`);
    console.log(`      - Posted ${tasks.filter(t => t.posterId === users[0].userId).length} tasks`);
    console.log(`      - Has ${notifications.filter(n => n.userId === users[0].userId).length} notifications`);
    console.log(`   2. Bob Smith (bob@example.com)`);
    console.log(`      - Posted ${tasks.filter(t => t.posterId === users[1].userId).length} tasks`);
    console.log(`      - Has ${notifications.filter(n => n.userId === users[1].userId).length} notifications`);
    console.log(`   3. Charlie Brown (charlie@example.com)`);
    console.log(`      - Has ${notifications.filter(n => n.userId === users[2].userId).length} notifications`);

    console.log('\n🔗 Task URLs (replace with your frontend URL):');
    tasks.forEach((task, index) => {
      console.log(`   Task ${index + 1}: http://localhost:5173/task/${task.taskId}`);
      console.log(`      Title: ${task.title}`);
      console.log(`      Status: ${task.status}`);
    });

    console.log('\n💡 How to Test:');
    console.log('   1. Log in as any of the test users (alice@example.com, bob@example.com, charlie@example.com)');
    console.log('   2. Go to "My Tasks" to see posted tasks');
    console.log('   3. Go to a task detail page to see bids and chat');
    console.log('   4. Click the notification bell to see notifications');
    console.log('   5. Start chatting on tasks that have bids or assigned helpers');
    console.log('\n✨ All set! Happy testing!\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error creating dummy data:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createDummyData();


