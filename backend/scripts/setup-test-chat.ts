/**
 * Script to set up a test scenario for chat functionality
 * Creates a task and a bid so users can chat
 * 
 * Usage: npx ts-node scripts/setup-test-chat.ts <posterUserId> <helperUserId>
 * 
 * Example:
 *   npx ts-node scripts/setup-test-chat.ts 9a178aae-9efb-42ab-b52a-9165f4268d89 960488ce-21d9-43a7-9f43-20e159a7f3bd
 */

import prisma from '../src/config/database';
import { TaskStatus, BidStatus } from '@prisma/client';

const posterUserId = process.argv[2];
const helperUserId = process.argv[3];

if (!posterUserId || !helperUserId) {
  console.error('❌ Error: Both poster and helper user IDs are required');
  console.log('\nUsage:');
  console.log('  npx ts-node scripts/setup-test-chat.ts <posterUserId> <helperUserId>');
  console.log('\nExample:');
  console.log('  npx ts-node scripts/setup-test-chat.ts 9a178aae-9efb-42ab-b52a-9165f4268d89 960488ce-21d9-43a7-9f43-20e159a7f3bd');
  console.log('\nTo find user IDs, run:');
  console.log('  npx ts-node scripts/list-users.ts');
  process.exit(1);
}

async function setupTestChat() {
  try {
    // Verify users exist
    const [poster, helper] = await Promise.all([
      prisma.user.findUnique({
        where: { userId: posterUserId },
        select: { userId: true, email: true, name: true },
      }),
      prisma.user.findUnique({
        where: { userId: helperUserId },
        select: { userId: true, email: true, name: true },
      }),
    ]);

    if (!poster) {
      console.error(`❌ Error: Poster user with ID "${posterUserId}" not found`);
      process.exit(1);
    }

    if (!helper) {
      console.error(`❌ Error: Helper user with ID "${helperUserId}" not found`);
      process.exit(1);
    }

    console.log(`\n📋 Setting up test chat scenario:`);
    console.log(`   Poster: ${poster.name || poster.email} (${posterUserId})`);
    console.log(`   Helper: ${helper.name || helper.email} (${helperUserId})`);

    // Create a location for the task
    const location = await prisma.location.create({
      data: {
        latitude: 42.3398, // Boston area
        longitude: -71.0892,
        address: '123 Test Street',
        city: 'Boston',
        state: 'MA',
        zipCode: '02115',
        country: 'USA',
      },
    });
    const locationId = location.locationId;
    console.log(`\n📍 Created location for task`);

    // Create a test task
    const task = await prisma.task.create({
      data: {
        posterId: posterUserId,
        locationId,
        title: 'Test Task for Chat',
        description: 'This is a test task created to test the chat functionality. You can chat about this task!',
        category: 'HOME_REPAIR',
        budget: 50,
        estimatedHours: 2,
        status: TaskStatus.OPEN,
        taskDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      },
    });

    console.log(`\n✅ Created test task:`);
    console.log(`   Task ID: ${task.taskId}`);
    console.log(`   Title: ${task.title}`);
    console.log(`   Status: ${task.status}`);

    // Create a bid from the helper
    const bid = await prisma.bid.create({
      data: {
        taskId: task.taskId,
        helperId: helperUserId,
        amount: 45,
        note: 'I can help with this task!',
        status: BidStatus.PENDING,
      },
    });

    console.log(`\n✅ Created test bid:`);
    console.log(`   Bid ID: ${bid.bidId}`);
    console.log(`   Amount: $${bid.amount}`);
    console.log(`   Status: ${bid.status}`);

    console.log(`\n🎉 Test scenario setup complete!`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Log in as the poster (${poster.email})`);
    console.log(`   2. Go to the task: http://localhost:5173/task/${task.taskId}`);
    console.log(`   3. You should see the bid and can start chatting with the helper`);
    console.log(`\n   OR`);
    console.log(`   1. Log in as the helper (${helper.email})`);
    console.log(`   2. Go to the task: http://localhost:5173/task/${task.taskId}`);
    console.log(`   3. You should see a "Start Chat" button to chat with the poster`);
    console.log(`\n📝 Task URL: http://localhost:5173/task/${task.taskId}`);

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error setting up test chat:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupTestChat();

