import Stripe from 'stripe';
import prisma from '../config/database';
import config from '../config/env';
import { PaymentStatus, PaymentType } from '@prisma/client';
import * as emailService from './email.service';

/**
 * Service for payment processing using Stripe (Marketplace model with Connect).
 * 
 * @module payment.service
 * @description Handles all payment-related operations including Stripe Connect account creation,
 * payment intent creation, payment confirmation, payouts to helpers, and refunds.
 */

const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

/**
 * Calculates platform fee and helper amount from agreed amount.
 * 
 * @param {number} agreedAmount - Total agreed amount between poster and helper
 * @returns {{platformFee: number, helperAmount: number}} Object with platform fee and helper's share
 * 
 * @example
 * const { platformFee, helperAmount } = calculateAmounts(100.00);
 * // Returns: { platformFee: 5.00, helperAmount: 95.00 } (assuming 5% platform fee)
 */
export const calculateAmounts = (agreedAmount: number): { platformFee: number; helperAmount: number } => {
  const platformFee = Math.round(agreedAmount * (config.PLATFORM_FEE_PERCENTAGE / 100) * 100) / 100;
  const helperAmount = Math.round((agreedAmount - platformFee) * 100) / 100;
  return { platformFee, helperAmount };
};

/**
 * Creates a Stripe Connect Express account for a helper to receive payouts.
 * 
 * @param {string} userId - User ID of the helper
 * @param {string} email - Helper's email address
 * @param {string} returnUrl - URL to redirect after Stripe onboarding completion
 * @returns {Promise<{accountId: string, onboardingUrl: string}>} Stripe account ID and onboarding URL
 * @throws {Error} If Stripe Connect is not enabled on the account
 * 
 * @example
 * const { accountId, onboardingUrl } = await createConnectAccount(
 *   'user-id',
 *   'helper@example.com',
 *   'https://app.com/onboarding-complete'
 * );
 * // Returns: { accountId: 'acct_...', onboardingUrl: 'https://connect.stripe.com/...' }
 */
export const createConnectAccount = async (userId: string, email: string, returnUrl: string): Promise<{ accountId: string; onboardingUrl: string }> => {
  try {
    // Create Express account for marketplace model
    // Platform collects payments, then transfers to connected accounts
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email,
      capabilities: {
        transfers: { requested: true }, // Required for receiving transfers in marketplace model
      },
    });

    // Store account ID in user record
    await prisma.user.update({
      where: { userId },
      data: { stripeAccountId: account.id },
    });

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  } catch (error: any) {
    // Handle specific Stripe Connect errors
    if (error?.code === 'account_invalid' || error?.message?.includes('Connect')) {
      throw new Error(
        'Stripe Connect is not enabled on your account. ' +
        'To enable it for testing: 1) Go to https://dashboard.stripe.com/test/settings/connect ' +
        '2) Click "Get started" or "Enable Connect" 3) Follow the setup wizard. ' +
        'This is free in test mode and required for payouts to work.'
      );
    }
    throw error;
  }
};

/**
 * Retrieves the status of a Stripe Connect account.
 * 
 * @param {string} accountId - Stripe Connect account ID
 * @returns {Promise<{detailsSubmitted: boolean, chargesEnabled: boolean, payoutsEnabled: boolean}>}
 *   Account status information
 * 
 * @example
 * const status = await getConnectAccountStatus('acct_123');
 * // Returns: { detailsSubmitted: true, chargesEnabled: true, payoutsEnabled: true }
 */
export const getConnectAccountStatus = async (accountId: string): Promise<{ detailsSubmitted: boolean; chargesEnabled: boolean; payoutsEnabled: boolean }> => {
  const account = await stripe.accounts.retrieve(accountId);
  return {
    detailsSubmitted: account.details_submitted,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
  };
};

/**
 * Creates a Stripe Payment Intent to charge the poster for an accepted bid.
 * 
 * @param {string} contractId - Contract ID associated with the payment
 * @param {number} amount - Amount to charge (in dollars)
 * @param {string} posterEmail - Poster's email for receipt
 * @param {string} description - Description of the payment
 * @returns {Promise<{paymentIntentId: string, clientSecret: string}>} Payment Intent ID and client secret for 3DS
 * 
 * @example
 * const { paymentIntentId, clientSecret } = await chargePoster(
 *   'contract-id',
 *   100.00,
 *   'poster@example.com',
 *   'Task: Clean apartment'
 * );
 * // Creates payment intent and updates contract status to PROCESSING
 */
export const chargePoster = async (
  contractId: string,
  amount: number,
  posterEmail: string,
  description: string
): Promise<{ paymentIntentId: string; clientSecret: string }> => {
  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    description,
    metadata: {
      contractId,
      type: 'escrow',
    },
    receipt_email: posterEmail,
  });

  // Update contract with payment intent ID
  await prisma.contract.update({
    where: { contractId },
    data: {
      paymentIntentId: paymentIntent.id,
      paymentStatus: PaymentStatus.PROCESSING,
    },
  });

  // Create payment record
  await prisma.payment.create({
    data: {
      contractId,
      type: PaymentType.CHARGE,
      amount,
      status: PaymentStatus.PROCESSING,
      stripeId: paymentIntent.id,
    },
  });

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret!,
  };
};

/**
 * Confirms a payment intent after 3D Secure/SCA verification.
 * Updates contract and payment status when payment succeeds.
 * 
 * @param {string} paymentIntentId - Stripe Payment Intent ID
 * @returns {Promise<void>}
 * @throws {Error} If contract not found or payment failed
 * 
 * @example
 * await confirmPayment('pi_1234567890');
 * // Updates contract.paymentStatus to COMPLETED when payment succeeds
 */
export const confirmPayment = async (paymentIntentId: string): Promise<void> => {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status === 'succeeded') {
    const contract = await prisma.contract.findUnique({
      where: { paymentIntentId },
      include: { poster: true, helper: true, task: true },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Get charge receipt URL
    let receiptUrl: string | null = null;
    if (paymentIntent.latest_charge) {
      const chargeId = typeof paymentIntent.latest_charge === 'string' 
        ? paymentIntent.latest_charge 
        : paymentIntent.latest_charge.id;
      const charge = await stripe.charges.retrieve(chargeId);
      receiptUrl = charge.receipt_url || null;
    }

    // Update contract and payment status
    await prisma.$transaction([
      prisma.contract.update({
        where: { contractId: contract.contractId },
        data: {
          paymentStatus: PaymentStatus.COMPLETED,
          paymentCompletedAt: new Date(),
        },
      }),
      prisma.payment.updateMany({
        where: { stripeId: paymentIntentId },
        data: {
          status: PaymentStatus.COMPLETED,
          receiptUrl,
        },
      }),
    ]);

    // Send confirmation emails
    await emailService.sendPaymentConfirmation(contract.poster.email, {
      contractId: contract.contractId,
      amount: Number(contract.agreedAmount),
      taskTitle: contract.task.title,
    });
  }
};

// Release payout to helper
export const releasePayout = async (contractId: string): Promise<void> => {
  const contract = await prisma.contract.findUnique({
    where: { contractId },
    include: { helper: true, task: true },
  });

  if (!contract) {
    throw new Error('Contract not found');
  }

  if (!contract.helper.stripeAccountId) {
    throw new Error('Helper has not completed Stripe Connect onboarding');
  }

  if (contract.paymentStatus !== PaymentStatus.COMPLETED) {
    throw new Error('Payment must be completed before releasing payout');
  }

  if (contract.payoutId) {
    throw new Error('Payout has already been released');
  }

  const { helperAmount, platformFee } = calculateAmounts(Number(contract.agreedAmount));

  // Create transfer to helper's Stripe Connect account (Marketplace model)
  // Platform account transfers funds to connected account, keeping the platform fee
  const transfer = await stripe.transfers.create({
    amount: Math.round(helperAmount * 100), // Convert to cents
    currency: 'usd',
    destination: contract.helper.stripeAccountId,
    metadata: {
      contractId,
      type: 'payout',
      platformFee: platformFee.toString(),
      originalAmount: contract.agreedAmount.toString(),
    },
  });

  // Update contract with payout information
  await prisma.$transaction([
    prisma.contract.update({
      where: { contractId },
      data: {
        payoutId: transfer.id,
        helperAmount,
        platformFee,
        payoutReleasedAt: new Date(),
      },
    }),
    prisma.payment.create({
      data: {
        contractId,
        type: PaymentType.PAYOUT,
        amount: helperAmount,
        status: PaymentStatus.COMPLETED,
        stripeId: transfer.id,
      },
    }),
  ]);

  // Send payout notification
  await emailService.sendPayoutNotification(contract.helper.email, {
    contractId: contract.contractId,
    amount: helperAmount,
    taskTitle: contract.task.title,
  });
};

// Auto-release payout after delay
export const autoReleasePayout = async (contractId: string): Promise<void> => {
  const contract = await prisma.contract.findUnique({
    where: { contractId },
  });

  if (!contract) {
    throw new Error('Contract not found');
  }

  if (!contract.autoReleaseAt || contract.autoReleaseAt > new Date()) {
    throw new Error('Auto-release time has not been reached');
  }

  if (contract.payoutId) {
    throw new Error('Payout has already been released');
  }

  await releasePayout(contractId);
};

// Refund payment (admin only)
export const refundPayment = async (
  contractId: string,
  amount: number | null, // null for full refund
  reason?: string
): Promise<void> => {
  const contract = await prisma.contract.findUnique({
    where: { contractId },
    include: { poster: true, helper: true, task: true },
  });

  if (!contract) {
    throw new Error('Contract not found');
  }

  if (!contract.paymentIntentId) {
    throw new Error('No payment found to refund');
  }

  // Get payment intent to check current status
  const paymentIntent = await stripe.paymentIntents.retrieve(contract.paymentIntentId);
  const chargeId = paymentIntent.latest_charge as string;

  if (!chargeId) {
    throw new Error('No charge found for this payment');
  }

  // Determine refund amount
  const refundAmount = amount || Number(contract.agreedAmount);
  const isPartialRefund = amount !== null && amount < Number(contract.agreedAmount);

  // Create refund
  const refund = await stripe.refunds.create({
    charge: chargeId,
    amount: Math.round(refundAmount * 100), // Convert to cents
    reason: reason ? 'requested_by_customer' : undefined,
    metadata: {
      contractId,
      reason: reason || 'admin_refund',
    },
  });

  // Update contract
  const newPaymentStatus = isPartialRefund
    ? PaymentStatus.PARTIALLY_REFUNDED
    : PaymentStatus.REFUNDED;

  await prisma.$transaction([
    prisma.contract.update({
      where: { contractId },
      data: {
        refundId: refund.id,
        refundAmount,
        paymentStatus: newPaymentStatus,
      },
    }),
    prisma.payment.create({
      data: {
        contractId,
        type: PaymentType.REFUND,
        amount: refundAmount,
        status: PaymentStatus.COMPLETED,
        stripeId: refund.id,
        metadata: JSON.stringify({ reason: reason || 'admin_refund' }),
      },
    }),
  ]);

  // Send refund notifications
  await Promise.all([
    emailService.sendRefundNotification(contract.poster.email, {
      contractId: contract.contractId,
      amount: refundAmount,
      taskTitle: contract.task.title,
      isPartial: isPartialRefund,
    }),
    emailService.sendRefundNotification(contract.helper.email, {
      contractId: contract.contractId,
      amount: refundAmount,
      taskTitle: contract.task.title,
      isPartial: isPartialRefund,
    }),
  ]);
};

// Get payment history for a contract
export const getPaymentHistory = async (contractId: string) => {
  return await prisma.payment.findMany({
    where: { contractId },
    orderBy: { createdAt: 'desc' },
  });
};

// Handle Stripe webhook events
export const handleWebhook = async (event: Stripe.Event): Promise<void> => {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    case 'transfer.created':
      await handleTransferCreated(event.data.object as Stripe.Transfer);
      break;
    case 'refund.created':
      await handleRefundCreated(event.data.object as Stripe.Refund);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};

const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent): Promise<void> => {
  const contract = await prisma.contract.findUnique({
    where: { paymentIntentId: paymentIntent.id },
    include: { poster: true, helper: true, task: true },
  });

  if (!contract) return;

  // Get charge receipt URL
  let receiptUrl: string | null = null;
  if (paymentIntent.latest_charge) {
    const chargeId = typeof paymentIntent.latest_charge === 'string' 
      ? paymentIntent.latest_charge 
      : paymentIntent.latest_charge.id;
    const charge = await stripe.charges.retrieve(chargeId);
    receiptUrl = charge.receipt_url || null;
  }

  await prisma.$transaction([
    prisma.contract.update({
      where: { contractId: contract.contractId },
      data: {
        paymentStatus: PaymentStatus.COMPLETED,
        paymentCompletedAt: new Date(),
        // Set auto-release time
        autoReleaseAt: new Date(Date.now() + config.AUTO_RELEASE_HOURS * 60 * 60 * 1000),
      },
    }),
    prisma.payment.updateMany({
      where: { stripeId: paymentIntent.id },
      data: {
        status: PaymentStatus.COMPLETED,
        receiptUrl,
      },
    }),
  ]);

  // Send confirmation email
  await emailService.sendPaymentConfirmation(contract.poster.email, {
    contractId: contract.contractId,
    amount: Number(contract.agreedAmount),
    taskTitle: contract.task.title,
  });
};

const handlePaymentIntentFailed = async (paymentIntent: Stripe.PaymentIntent): Promise<void> => {
  const contract = await prisma.contract.findUnique({
    where: { paymentIntentId: paymentIntent.id },
  });

  if (!contract) return;

  await prisma.$transaction([
    prisma.contract.update({
      where: { contractId: contract.contractId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
      },
    }),
    prisma.payment.updateMany({
      where: { stripeId: paymentIntent.id },
      data: {
        status: PaymentStatus.FAILED,
      },
    }),
  ]);
};

const handleTransferCreated = async (transfer: Stripe.Transfer): Promise<void> => {
  const contract = await prisma.contract.findUnique({
    where: { payoutId: transfer.id },
  });

  if (!contract) return;

  await prisma.payment.updateMany({
    where: { stripeId: transfer.id },
    data: {
      status: PaymentStatus.COMPLETED,
    },
  });
};

const handleRefundCreated = async (refund: Stripe.Refund): Promise<void> => {
  const contract = await prisma.contract.findUnique({
    where: { refundId: refund.id },
  });

  if (!contract) return;

  // Get the charge to compare amounts
  const chargeId = typeof refund.charge === 'string' ? refund.charge : refund.charge?.id;
  if (!chargeId) {
    throw new Error('No charge found for refund');
  }
  
  const charge = await stripe.charges.retrieve(chargeId);
  const isPartial = refund.amount < charge.amount;
  const newPaymentStatus = isPartial
    ? PaymentStatus.PARTIALLY_REFUNDED
    : PaymentStatus.REFUNDED;

  await prisma.contract.update({
    where: { contractId: contract.contractId },
    data: {
      paymentStatus: newPaymentStatus,
      refundAmount: refund.amount / 100, // Convert from cents
    },
  });
};

