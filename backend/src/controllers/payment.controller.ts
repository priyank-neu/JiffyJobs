import { Response } from 'express';
import { AuthRequest } from '../types';
import * as paymentService from '../services/payment.service';
import prisma from '../config/database';

// Create Stripe Connect account and onboarding link
export const createConnectAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { userId: req.user.userId },
      select: { email: true, stripeAccountId: true, stripeOnboardingComplete: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // If already has account, return existing onboarding status
    if (user.stripeAccountId) {
      const status = await paymentService.getConnectAccountStatus(user.stripeAccountId);
      
      if (status.detailsSubmitted && status.chargesEnabled && status.payoutsEnabled) {
        await prisma.user.update({
          where: { userId: req.user.userId },
          data: { stripeOnboardingComplete: true },
        });
      }

      res.status(200).json({
        message: 'Stripe account exists',
        accountId: user.stripeAccountId,
        onboardingComplete: status.detailsSubmitted && status.chargesEnabled && status.payoutsEnabled,
      });
      return;
    }

    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/payments?return=true`;
    const { accountId, onboardingUrl } = await paymentService.createConnectAccount(
      req.user.userId,
      user.email,
      returnUrl
    );

    res.status(200).json({
      message: 'Stripe Connect account created',
      accountId,
      onboardingUrl,
    });
  } catch (error: any) {
    console.error('Error creating Connect account:', error);
    if (error instanceof Error) {
      // Provide more helpful error messages
      if (error.message.includes('Connect')) {
        res.status(400).json({ 
          error: error.message,
          helpUrl: 'https://dashboard.stripe.com/test/settings/connect',
          instructions: 'Please enable Stripe Connect in your dashboard to continue. This is free in test mode.'
        });
      } else {
        res.status(400).json({ error: error.message });
      }
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Get Connect account status
export const getConnectAccountStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { userId: req.user.userId },
      select: { stripeAccountId: true },
    });

    if (!user || !user.stripeAccountId) {
      res.status(404).json({ error: 'No Stripe Connect account found' });
      return;
    }

    const status = await paymentService.getConnectAccountStatus(user.stripeAccountId);

    res.status(200).json({
      message: 'Account status retrieved',
      status,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Confirm payment intent (after 3DS/SCA)
export const confirmPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      res.status(400).json({ error: 'Payment intent ID is required' });
      return;
    }

    await paymentService.confirmPayment(paymentIntentId);

    res.status(200).json({
      message: 'Payment confirmed successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Release payout manually
export const releasePayout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { contractId } = req.params;

    if (!contractId) {
      res.status(400).json({ error: 'Contract ID is required' });
      return;
    }

    // Verify user has permission (poster or admin)
    const contract = await prisma.contract.findUnique({
      where: { contractId },
      select: { posterId: true },
    });

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    if (contract.posterId !== req.user.userId) {
      res.status(403).json({ error: 'Only the poster can release the payout' });
      return;
    }

    await paymentService.releasePayout(contractId);

    res.status(200).json({
      message: 'Payout released successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Refund payment (admin only)
export const refundPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // TODO: Add admin check
    // if (req.user.role !== 'ADMIN') {
    //   res.status(403).json({ error: 'Admin access required' });
    //   return;
    // }

    const { contractId } = req.params;
    const { amount, reason } = req.body;

    if (!contractId) {
      res.status(400).json({ error: 'Contract ID is required' });
      return;
    }

    await paymentService.refundPayment(contractId, amount || null, reason);

    res.status(200).json({
      message: 'Refund processed successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Get payment history
export const getPaymentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { contractId } = req.params;

    if (!contractId) {
      res.status(400).json({ error: 'Contract ID is required' });
      return;
    }

    // Verify user has permission
    const contract = await prisma.contract.findUnique({
      where: { contractId },
      select: { posterId: true, helperId: true },
    });

    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    if (contract.posterId !== req.user.userId && contract.helperId !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const payments = await paymentService.getPaymentHistory(contractId);

    res.status(200).json({
      message: 'Payment history retrieved',
      payments: payments.map(p => ({
        ...p,
        amount: Number(p.amount),
        metadata: p.metadata ? JSON.parse(p.metadata) : null,
      })),
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Get Stripe publishable key (for frontend)
export const getPublishableKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
    res.status(200).json({ publishableKey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get publishable key' });
  }
};

// Handle Stripe webhook
export const handleWebhook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    // Verify webhook signature
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle the event
    await paymentService.handleWebhook(event);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: `Webhook Error: ${error.message}` });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

