import prisma from '../config/database';
import { AccountStatus } from '@prisma/client';
import * as auditService from './audit.service';
import * as notificationService from './notification.service';
import * as paymentService from './payment.service';
import { NotificationType } from '@prisma/client';

/**
 * Suspend a user (admin only)
 */
export const suspendUser = async (userId: string, adminId: string, reason?: string) => {
  const user = await prisma.user.findUnique({
    where: { userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.accountStatus === AccountStatus.SUSPENDED) {
    throw new Error('User is already suspended');
  }

  const updatedUser = await prisma.user.update({
    where: { userId },
    data: {
      accountStatus: AccountStatus.SUSPENDED,
    },
  });

  // Log audit trail
  await auditService.createAuditLog({
    adminId,
    action: 'SUSPEND_USER',
    entityType: 'User',
    entityId: userId,
    details: {
      previousStatus: user.accountStatus,
      reason,
    },
    notes: reason || 'User suspended by admin',
  });

  // Send notification
  try {
    await notificationService.createNotification({
      userId,
      type: NotificationType.OTHER,
      title: 'Account Suspended',
      message: `Your account has been suspended. ${reason || 'Please contact support for more information.'}`,
      sendEmail: true,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }

  return updatedUser;
};

/**
 * Reactivate a user (admin only)
 */
export const reactivateUser = async (userId: string, adminId: string) => {
  const user = await prisma.user.findUnique({
    where: { userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.accountStatus !== AccountStatus.SUSPENDED) {
    throw new Error('User is not suspended');
  }

  const updatedUser = await prisma.user.update({
    where: { userId },
    data: {
      accountStatus: AccountStatus.ACTIVE,
    },
  });

  // Log audit trail
  await auditService.createAuditLog({
    adminId,
    action: 'REACTIVATE_USER',
    entityType: 'User',
    entityId: userId,
    details: {
      previousStatus: user.accountStatus,
    },
    notes: 'User reactivated by admin',
  });

  // Send notification
  try {
    await notificationService.createNotification({
      userId,
      type: NotificationType.OTHER,
      title: 'Account Reactivated',
      message: 'Your account has been reactivated. You can now access all features.',
      sendEmail: true,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }

  return updatedUser;
};

/**
 * Hide a review (admin only)
 */
export const hideReview = async (reviewId: string, adminId: string, reason?: string) => {
  const review = await prisma.review.findUnique({
    where: { reviewId },
    include: {
      reviewer: true,
      reviewee: true,
    },
  });

  if (!review) {
    throw new Error('Review not found');
  }

  if (review.isHidden) {
    throw new Error('Review is already hidden');
  }

  const updatedReview = await prisma.review.update({
    where: { reviewId },
    data: {
      isHidden: true,
    },
  });

  // Log audit trail
  await auditService.createAuditLog({
    adminId,
    action: 'HIDE_REVIEW',
    entityType: 'Review',
    entityId: reviewId,
    details: {
      reason,
    },
    notes: reason || 'Review hidden by admin',
  });

  // Send notifications
  try {
    await Promise.all([
      notificationService.createNotification({
        userId: review.reviewerId,
        type: NotificationType.OTHER,
        title: 'Review Hidden',
        message: `Your review has been hidden by moderation. ${reason || ''}`,
        sendEmail: true,
      }),
      notificationService.createNotification({
        userId: review.revieweeId,
        type: NotificationType.OTHER,
        title: 'Review Hidden',
        message: `A review about you has been hidden by moderation.`,
        sendEmail: true,
      }),
    ]);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }

  return updatedReview;
};

/**
 * Unhide a review (admin only)
 */
export const unhideReview = async (reviewId: string, adminId: string) => {
  const review = await prisma.review.findUnique({
    where: { reviewId },
  });

  if (!review) {
    throw new Error('Review not found');
  }

  if (!review.isHidden) {
    throw new Error('Review is not hidden');
  }

  const updatedReview = await prisma.review.update({
    where: { reviewId },
    data: {
      isHidden: false,
    },
  });

  // Log audit trail
  await auditService.createAuditLog({
    adminId,
    action: 'UNHIDE_REVIEW',
    entityType: 'Review',
    entityId: reviewId,
    notes: 'Review unhidden by admin',
  });

  return updatedReview;
};

/**
 * Lock a task (admin only)
 */
export const lockTask = async (
  taskId: string,
  adminId: string,
  reason: string,
  reportId?: string
) => {
  const task = await prisma.task.findUnique({
    where: { taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  if (task.isLocked) {
    throw new Error('Task is already locked');
  }

  const updatedTask = await prisma.task.update({
    where: { taskId },
    data: {
      isLocked: true,
      lockedReason: reason,
      lockedAt: new Date(),
      lockedBy: adminId,
    },
  });

  // Log audit trail
  await auditService.createAuditLog({
    adminId,
    action: 'LOCK_TASK',
    entityType: 'Task',
    entityId: taskId,
    reportId,
    details: {
      reason,
    },
    notes: `Task locked: ${reason}`,
  });

  // Send notification to poster
  try {
    await notificationService.createNotification({
      userId: task.posterId,
      type: NotificationType.OTHER,
      title: 'Task Locked',
      message: `Your task "${task.title}" has been locked for review. Reason: ${reason}`,
      relatedTaskId: taskId,
      sendEmail: true,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }

  return updatedTask;
};

/**
 * Unlock a task (admin only)
 */
export const unlockTask = async (taskId: string, adminId: string) => {
  const task = await prisma.task.findUnique({
    where: { taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  if (!task.isLocked) {
    throw new Error('Task is not locked');
  }

  const updatedTask = await prisma.task.update({
    where: { taskId },
    data: {
      isLocked: false,
      lockedReason: null,
      lockedAt: null,
      lockedBy: null,
    },
  });

  // Log audit trail
  await auditService.createAuditLog({
    adminId,
    action: 'UNLOCK_TASK',
    entityType: 'Task',
    entityId: taskId,
    notes: 'Task unlocked by admin',
  });

  // Send notification to poster
  try {
    await notificationService.createNotification({
      userId: task.posterId,
      type: NotificationType.OTHER,
      title: 'Task Unlocked',
      message: `Your task "${task.title}" has been unlocked and is now active.`,
      relatedTaskId: taskId,
      sendEmail: true,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }

  return updatedTask;
};

/**
 * Lock a contract (admin only)
 */
export const lockContract = async (
  contractId: string,
  adminId: string,
  reason: string,
  reportId?: string
) => {
  const contract = await prisma.contract.findUnique({
    where: { contractId },
    include: {
      task: true,
    },
  });

  if (!contract) {
    throw new Error('Contract not found');
  }

  if (contract.isLocked) {
    throw new Error('Contract is already locked');
  }

  const updatedContract = await prisma.contract.update({
    where: { contractId },
    data: {
      isLocked: true,
      lockedReason: reason,
      lockedAt: new Date(),
      lockedBy: adminId,
    },
  });

  // Log audit trail
  await auditService.createAuditLog({
    adminId,
    action: 'LOCK_CONTRACT',
    entityType: 'Contract',
    entityId: contractId,
    reportId,
    details: {
      reason,
    },
    notes: `Contract locked: ${reason}`,
  });

  // Send notifications
  try {
    await Promise.all([
      notificationService.createNotification({
        userId: contract.posterId,
        type: NotificationType.OTHER,
        title: 'Contract Locked',
        message: `Your contract for "${contract.task.title}" has been locked for review. Reason: ${reason}`,
        sendEmail: true,
      }),
      notificationService.createNotification({
        userId: contract.helperId,
        type: NotificationType.OTHER,
        title: 'Contract Locked',
        message: `Your contract for "${contract.task.title}" has been locked for review. Reason: ${reason}`,
        sendEmail: true,
      }),
    ]);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }

  return updatedContract;
};

/**
 * Unlock a contract (admin only)
 */
export const unlockContract = async (contractId: string, adminId: string) => {
  const contract = await prisma.contract.findUnique({
    where: { contractId },
    include: {
      task: true,
    },
  });

  if (!contract) {
    throw new Error('Contract not found');
  }

  if (!contract.isLocked) {
    throw new Error('Contract is not locked');
  }

  const updatedContract = await prisma.contract.update({
    where: { contractId },
    data: {
      isLocked: false,
      lockedReason: null,
      lockedAt: null,
      lockedBy: null,
    },
  });

  // Log audit trail
  await auditService.createAuditLog({
    adminId,
    action: 'UNLOCK_CONTRACT',
    entityType: 'Contract',
    entityId: contractId,
    notes: 'Contract unlocked by admin',
  });

  // Send notifications
  try {
    await Promise.all([
      notificationService.createNotification({
        userId: contract.posterId,
        type: NotificationType.OTHER,
        title: 'Contract Unlocked',
        message: `Your contract for "${contract.task.title}" has been unlocked and is now active.`,
        sendEmail: true,
      }),
      notificationService.createNotification({
        userId: contract.helperId,
        type: NotificationType.OTHER,
        title: 'Contract Unlocked',
        message: `Your contract for "${contract.task.title}" has been unlocked and is now active.`,
        sendEmail: true,
      }),
    ]);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }

  return updatedContract;
};

/**
 * Trigger refund for a contract (admin only)
 */
export const triggerRefund = async (
  contractId: string,
  adminId: string,
  amount: number | null, // null for full refund
  reason: string,
  reportId?: string
) => {
  const contract = await prisma.contract.findUnique({
    where: { contractId },
    include: {
      task: true,
      poster: true,
      helper: true,
    },
  });

  if (!contract) {
    throw new Error('Contract not found');
  }

  if (!contract.paymentIntentId) {
    throw new Error('No payment found for this contract');
  }

  // Use payment service to process refund
  await paymentService.refundPayment(contractId, amount, reason);

  // Log audit trail
  await auditService.createAuditLog({
    adminId,
    action: 'TRIGGER_REFUND',
    entityType: 'Contract',
    entityId: contractId,
    reportId,
    details: {
      amount: amount || Number(contract.agreedAmount),
      reason,
    },
    notes: `Refund triggered: ${reason}`,
  });

  // Send notifications
  try {
    await Promise.all([
      notificationService.createNotification({
        userId: contract.posterId,
        type: NotificationType.OTHER,
        title: 'Refund Processed',
        message: `A refund of $${amount ? amount.toFixed(2) : Number(contract.agreedAmount).toFixed(2)} has been processed for your contract. Reason: ${reason}`,
        sendEmail: true,
      }),
      notificationService.createNotification({
        userId: contract.helperId,
        type: NotificationType.OTHER,
        title: 'Refund Processed',
        message: `A refund has been processed for your contract. Reason: ${reason}`,
        sendEmail: true,
      }),
    ]);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }

  return contract;
};

