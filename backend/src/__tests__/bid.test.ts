import request from 'supertest';
import { Application } from 'express';
import prisma from '../config/database';
import { BidStatus } from '@prisma/client';
import { createApp } from './helpers';
import * as bcrypt from 'bcryptjs';

describe('Bid API', () => {
  let app: Application;
  let poster: { userId: string; email: string };
  let helper: { userId: string; email: string };
  let task: { taskId: string };
  let authToken: string;

  beforeAll(async () => {
    app = createApp();
    
    // Create test users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    poster = await prisma.user.create({
      data: {
        email: 'poster@test.com',
        passwordHash,
        name: 'Test Poster',
      },
    });

    helper = await prisma.user.create({
      data: {
        email: 'helper@test.com',
        passwordHash,
        name: 'Test Helper',
      },
    });

    // Create a location
    const location = await prisma.location.create({
      data: {
        latitude: 42.3398,
        longitude: -71.0892,
        address: '123 Test St',
        city: 'Boston',
        state: 'MA',
        zipCode: '02115',
      },
    });

    // Create a task
    task = await prisma.task.create({
      data: {
        posterId: poster.userId,
        title: 'Test Task',
        description: 'Test task description',
        budget: 50.00,
        category: 'CLEANING',
        status: 'OPEN',
        locationId: location.locationId,
      },
    });

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'helper@test.com',
        password: 'password123',
      });
    
    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.bid.deleteMany({
      where: {
        taskId: task.taskId,
      },
    });
    await prisma.task.deleteMany({
      where: {
        taskId: task.taskId,
      },
    });
    await prisma.location.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['poster@test.com', 'helper@test.com'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/bids', () => {
    it('should place a bid on an open task', async () => {
      const response = await request(app)
        .post('/api/bids')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskId: task.taskId,
          amount: 50.00,
          note: 'I can help with this task',
        });

      expect(response.status).toBe(201);
      expect(response.body.bid).toHaveProperty('bidId');
      expect(response.body.bid.amount).toBe(50.00);
      expect(response.body.bid.status).toBe('PENDING');
      expect(response.body.bid.note).toBe('I can help with this task');
    });

    it('should return 400 for invalid amount', async () => {
      const response = await request(app)
        .post('/api/bids')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskId: task.taskId,
          amount: -10,
          note: 'Invalid bid',
        });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .post('/api/bids')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskId: 'non-existent-id',
          amount: 50.00,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/bids/my-bids', () => {
    it('should return user bids', async () => {
      const response = await request(app)
        .get('/api/bids/my-bids')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('bids');
      expect(Array.isArray(response.body.bids)).toBe(true);
    });
  });
});

