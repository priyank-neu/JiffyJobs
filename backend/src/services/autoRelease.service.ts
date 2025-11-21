import prisma from '../config/database';
import * as paymentService from './payment.service';

// Check and process auto-releases
export const processAutoReleases = async (): Promise<void> => {
  const now = new Date();

  // Find contracts eligible for auto-release
  const contracts = await prisma.contract.findMany({
    where: {
      autoReleaseAt: {
        lte: now, // Auto-release time has passed
      },
      payoutId: null, // Payout hasn't been released yet
      paymentStatus: 'COMPLETED', // Payment is completed
    },
    include: {
      task: {
        select: {
          status: true,
        },
      },
    },
  });

  console.log(`Found ${contracts.length} contracts eligible for auto-release`);

  for (const contract of contracts) {
    try {
      // Only auto-release if task is awaiting confirmation
      if (contract.task.status === 'AWAITING_CONFIRMATION') {
        console.log(`Auto-releasing payout for contract ${contract.contractId}`);
        await paymentService.autoReleasePayout(contract.contractId);
        console.log(`Successfully auto-released payout for contract ${contract.contractId}`);
      }
    } catch (error) {
      console.error(`Error auto-releasing payout for contract ${contract.contractId}:`, error);
      // Continue with other contracts even if one fails
    }
  }
};

// Start auto-release scheduler (runs every hour)
export const startAutoReleaseScheduler = (): void => {
  // Run immediately on start
  processAutoReleases().catch(console.error);

  // Then run every hour
  setInterval(() => {
    processAutoReleases().catch(console.error);
  }, 60 * 60 * 1000); // 1 hour

  console.log('Auto-release scheduler started');
};

