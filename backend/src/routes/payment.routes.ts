import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import express from 'express';

const router = Router();

// Get Stripe publishable key
router.get('/publishable-key', authenticate, paymentController.getPublishableKey);

// Stripe Connect onboarding
router.post('/connect/create', authenticate, paymentController.createConnectAccount);
router.get('/connect/status', authenticate, paymentController.getConnectAccountStatus);

// Payment operations
router.post('/confirm', authenticate, paymentController.confirmPayment);
router.post('/payout/:contractId', authenticate, paymentController.releasePayout);
router.get('/history/:contractId', authenticate, paymentController.getPaymentHistory);

// Refund (admin only)
router.post('/refund/:contractId', authenticate, paymentController.refundPayment);

// Webhook (no auth - uses Stripe signature verification)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // Raw body for webhook signature verification
  paymentController.handleWebhook
);

export default router;

