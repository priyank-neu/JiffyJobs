const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://jiffyjobs_user:jiffyjobs_password@localhost:5432/jiffyjobs_dev?schema=public'
    }
  }
});

async function seedData() {
  try {
    console.log('Seeding database with test data...');
    
    // Create users
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'patelhrutika@gmail.com' },
        update: {},
        create: {
          email: 'patelhrutika@gmail.com',
          passwordHash: '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ',
          name: 'Hrutika',
          isVerified: true
        }
      }),
      prisma.user.upsert({
        where: { email: 'jane@example.com' },
        update: {},
        create: {
          email: 'jane@example.com',
          passwordHash: '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ',
          name: 'Jane Smith',
          isVerified: true
        }
      }),
      prisma.user.upsert({
        where: { email: 'john@example.com' },
        update: {},
        create: {
          email: 'john@example.com',
          passwordHash: '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ',
          name: 'John Doe',
          isVerified: true
        }
      }),
      prisma.user.upsert({
        where: { email: 'mike@example.com' },
        update: {},
        create: {
          email: 'mike@example.com',
          passwordHash: '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ',
          name: 'Mike Johnson',
          isVerified: true
        }
      })
    ]);
    
    console.log('Users created:', users.map(u => u.name));
    
    // Create locations
    const locations = await Promise.all([
      prisma.location.create({
        data: {
          latitude: 42.3398,
          longitude: -71.0882,
          address: '123 Main St',
          city: 'Boston',
          state: 'MA',
          zipCode: '02101',
          country: 'USA'
        }
      }),
      prisma.location.create({
        data: {
          latitude: 42.3601,
          longitude: -71.0589,
          address: '456 Beacon St',
          city: 'Boston',
          state: 'MA',
          zipCode: '02115',
          country: 'USA'
        }
      })
    ]);
    
    // Create tasks
    const tasks = await Promise.all([
      prisma.task.create({
        data: {
          title: 'Help with Website Design',
          description: 'Need help creating a modern website for my small business. Looking for someone with experience in React and modern web development.',
          category: 'TECH_SUPPORT',
          budget: 150.00,
          budgetMin: 100.00,
          budgetMax: 200.00,
          status: 'ASSIGNED',
          locationId: locations[0].locationId,
          addressMasked: '123 Main St, Boston, MA',
          taskDate: new Date('2024-12-20T10:00:00Z'),
          estimatedHours: 4,
          posterId: users[0].userId,
          assignedHelperId: users[1].userId
        }
      }),
      prisma.task.create({
        data: {
          title: 'Garden Cleanup and Landscaping',
          description: 'Need help cleaning up my backyard garden and doing some basic landscaping. Looking for someone with gardening experience who can help with weeding, pruning, and planting some new flowers.',
          category: 'YARD_WORK',
          budget: 200.00,
          budgetMin: 150.00,
          budgetMax: 250.00,
          status: 'OPEN',
          locationId: locations[1].locationId,
          addressMasked: '456 Beacon St, Boston, MA',
          taskDate: new Date('2024-12-22T09:00:00Z'),
          estimatedHours: 6,
          posterId: users[0].userId
        }
      })
    ]);
    
    console.log('Tasks created:', tasks.map(t => t.title));
    
    // Create bids
    const bids = await Promise.all([
      prisma.bid.create({
        data: {
          taskId: tasks[0].taskId,
          helperId: users[1].userId,
          amount: 120.00,
          note: "I have 5+ years of experience in web design and can create a modern, responsive website for your business.",
          status: 'ACCEPTED'
        }
      }),
      prisma.bid.create({
        data: {
          taskId: tasks[0].taskId,
          helperId: users[2].userId,
          amount: 140.00,
          note: "Professional web developer with expertise in modern frameworks.",
          status: 'REJECTED'
        }
      }),
      prisma.bid.create({
        data: {
          taskId: tasks[0].taskId,
          helperId: users[3].userId,
          amount: 100.00,
          note: "I'm a freelance designer with a portfolio of successful business websites.",
          status: 'REJECTED'
        }
      }),
      prisma.bid.create({
        data: {
          taskId: tasks[1].taskId,
          helperId: users[1].userId,
          amount: 180.00,
          note: "I'm a professional landscaper with 8+ years of experience.",
          status: 'PENDING'
        }
      }),
      prisma.bid.create({
        data: {
          taskId: tasks[1].taskId,
          helperId: users[2].userId,
          amount: 160.00,
          note: "I love gardening and have been doing yard work for neighbors for 3 years.",
          status: 'PENDING'
        }
      }),
      prisma.bid.create({
        data: {
          taskId: tasks[1].taskId,
          helperId: users[3].userId,
          amount: 220.00,
          note: "Professional gardener with certification in landscape design.",
          status: 'PENDING'
        }
      })
    ]);
    
    console.log('Bids created:', bids.length);
    
    // Create contract for assigned task
    await prisma.contract.create({
      data: {
        taskId: tasks[0].taskId,
        helperId: users[1].userId,
        posterId: users[0].userId,
        agreedAmount: 120.00,
        acceptedBidId: bids[0].bidId
      }
    });
    
    console.log('✅ Database seeded successfully!');
    console.log('Users:', users.length);
    console.log('Tasks:', tasks.length);
    console.log('Bids:', bids.length);
    console.log('Contract: 1');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();
