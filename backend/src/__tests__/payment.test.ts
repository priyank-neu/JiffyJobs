import request from 'supertest';
import { Express } from 'express';
import prisma from '../config/database';
import { createApp } from './helpers';
import * as bcrypt from 'bcryptjs';

describe('Payment API', () => {
  let app: Express;
  let poster: { userId: string; email: string };
  let helper: { userId: string; email: string };
  let task: { taskId: string };
  let contract: { contractId: string };
  let posterToken: string;

  beforeAll(async () => {
    app = createApp();
    
    const passwordHash = await bcrypt.hash('password123', 10);
    
    poster = await prisma.user.create({
      data: {
        email: 'paymentposter@test.com',
        passwordHash,
        name: 'Payment Poster',
      },
    });

    helper = await prisma.user.create({
      data: {
        email: 'paymenthelper@test.com',
        passwordHash,
        name: 'Payment Helper',
        stripeAccountId: 'acct_test_123',
        stripeOnboardingComplete: true,
      },
    });

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

    task = await prisma.task.create({
      data: {
        posterId: poster.userId,
        title: 'Payment Test Task',
        description: 'Test task for payment',
        budget: 100.00,
        category: 'CLEANING',
        status: 'OPEN',
        locationId: location.locationId,
      },
    });

    const bid = await prisma.bid.create({
      data: {
        taskId: task.taskId,
        helperId: helper.userId,
        amount: 100.00,
        status: 'ACCEPTED',
      },
    });

    contract = await prisma.contract.create({
      data: {
        taskId: task.taskId,
        helperId: helper.userId,
        posterId: poster.userId,
        acceptedBidId: bid.bidId,
        agreedAmount: 100.00,
        status: 'PENDING_PAYMENT',
      },
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'paymentposter@test.com',
        password: 'password123',
      });
    
    posterToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({
      where: {
        contractId: contract.contractId,
      },
    });
    await prisma.contract.deleteMany({
      where: {
        contractId: contract.contractId,
      },
    });
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
          in: ['paymentposter@test.com', 'paymenthelper@test.com'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/payments/create-payment-intent', () => {
    it('should create payment intent for contract', async () => {
      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .set('Authorization', `Bearer ${posterToken}`)
        .send({
          contractId: contract.contractId,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('clientSecret');
      expect(response.body).toHaveProperty('paymentIntentId');
    });

    it('should return 404 for non-existent contract', async () => {
      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .set('Authorization', `Bearer ${posterToken}`)
        .send({
          contractId: 'non-existent-id',
        });

      expect(response.status).toBe(404);
    });
  });
});

