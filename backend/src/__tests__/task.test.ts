import request from 'supertest';
import { Application } from 'express';
import prisma from '../config/database';
import { createApp } from './helpers';
import * as bcrypt from 'bcryptjs';

describe('Task API', () => {
  let app: Application;
  let user: { userId: string; email: string };
  let authToken: string;
  let location: { locationId: string };

  beforeAll(async () => {
    app = createApp();
    
    const passwordHash = await bcrypt.hash('password123', 10);
    user = await prisma.user.create({
      data: {
        email: 'taskuser@test.com',
        passwordHash,
        name: 'Task User',
      },
    });

    location = await prisma.location.create({
      data: {
        latitude: 42.3398,
        longitude: -71.0892,
        address: '123 Test St',
        city: 'Boston',
        state: 'MA',
        zipCode: '02115',
      },
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'taskuser@test.com',
        password: 'password123',
      });
    
    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await prisma.task.deleteMany({
      where: {
        posterId: user.userId,
      },
    });
    await prisma.location.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: 'taskuser@test.com',
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test task description',
          budget: 100.00,
          category: 'CLEANING',
          location: {
            latitude: 42.3398,
            longitude: -71.0892,
            address: '123 Test St',
            city: 'Boston',
            state: 'MA',
            zipCode: '02115',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.task).toHaveProperty('taskId');
      expect(response.body.task.title).toBe('Test Task');
      expect(response.body.task.status).toBe('OPEN');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Incomplete Task',
          // Missing description, budget, etc.
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/tasks/my-tasks', () => {
    it('should return user tasks', async () => {
      const response = await request(app)
        .get('/api/tasks/my-tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tasks');
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });
  });
});

