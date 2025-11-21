import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test database URL if not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/jiffyjobs_test';
}

// Mock external services for testing
jest.mock('../services/email.service', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../services/upload.service', () => ({
  getPresignedUrl: jest.fn().mockResolvedValue({
    uploadUrl: 'https://mock-s3-url.com/upload',
    fileUrl: 'https://mock-s3-url.com/file',
    key: 'mock-key',
    isBase64Upload: false,
  }),
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method',
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 5000,
      }),
    },
    accounts: {
      create: jest.fn().mockResolvedValue({
        id: 'acct_test_123',
      }),
      createLoginLink: jest.fn().mockResolvedValue({
        url: 'https://connect.stripe.com/test',
      }),
    },
    refunds: {
      create: jest.fn().mockResolvedValue({
        id: 're_test_123',
        status: 'succeeded',
      }),
    },
  }));
});

