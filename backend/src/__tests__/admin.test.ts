import request from 'supertest';
import { Application } from 'express';
import prisma from '../config/database';
import { createApp } from './helpers';
import * as bcrypt from 'bcryptjs';
import { UserRole, AccountStatus } from '@prisma/client';

describe('Admin API', () => {
  let app: Application;
  let adminUser: { userId: string; email: string };
  let regularUser: { userId: string; email: string };
  let adminToken: string;
  let regularToken: string;

  beforeAll(async () => {
    app = createApp();
    
    const passwordHash = await bcrypt.hash('password123', 10);
    
    // Create admin user
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        passwordHash,
        name: 'Admin User',
        role: UserRole.ADMIN,
      },
    });

    // Create regular user
    regularUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        passwordHash,
        name: 'Regular User',
        role: UserRole.POSTER,
      },
    });

    // Login as admin
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });
    adminToken = adminLoginResponse.body.token;

    // Login as regular user
    const regularLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'password123',
      });
    regularToken = regularLoginResponse.body.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin@test.com', 'user@test.com'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/admin/users/:userId/suspend', () => {
    it('should suspend user as admin', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${regularUser.userId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Violation of terms',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('suspended');
      
      // Verify user is suspended
      const updatedUser = await prisma.user.findUnique({
        where: { userId: regularUser.userId },
      });
      expect(updatedUser?.accountStatus).toBe(AccountStatus.SUSPENDED);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${regularUser.userId}/suspend`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          reason: 'Test',
        });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/admin/users/non-existent-id/suspend')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Test',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/admin/reports', () => {
    it('should return reports as admin', async () => {
      const response = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reports');
      expect(Array.isArray(response.body.reports)).toBe(true);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });
});

