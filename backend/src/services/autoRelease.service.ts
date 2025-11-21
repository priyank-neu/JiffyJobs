import prisma from '../config/database';
import * as paymentService from './payment.service';

// Helper to check if database is ready
const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};

// Check and process auto-releases
export const processAutoReleases = async (): Promise<void> => {
  // Check database connection first
  const dbReady = await checkDatabaseConnection();
  if (!dbReady) {
    console.warn('Database not ready, skipping auto-release check');
    return;
  }

  try {
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
  } catch (error: any) {
    // Handle database errors gracefully (e.g., tables don't exist yet)
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      console.warn('Database tables not ready, skipping auto-release check:', error.message);
      return;
    }
    console.error('Error processing auto-releases:', error);
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

