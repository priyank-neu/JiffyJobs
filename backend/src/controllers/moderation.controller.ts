import { Response } from 'express';
import { AuthRequest } from '../types';
import * as moderationService from '../services/moderation.service';
import * as auditService from '../services/audit.service';

/**
 * Suspend a user (admin only)
 */
export const suspendUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { userId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const user = await moderationService.suspendUser(userId, req.user.userId, reason);

    res.status(200).json({
      message: 'User suspended successfully',
      user: {
        userId: user.userId,
        email: user.email,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to suspend user' });
    }
  }
};

/**
 * Reactivate a user (admin only)
 */
export const reactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const user = await moderationService.reactivateUser(userId, req.user.userId);

    res.status(200).json({
      message: 'User reactivated successfully',
      user: {
        userId: user.userId,
        email: user.email,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    console.error('Error reactivating user:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to reactivate user' });
    }
  }
};

/**
 * Hide a review (admin only)
 */
export const hideReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { reviewId } = req.params;
    const { reason } = req.body;

    if (!reviewId) {
      res.status(400).json({ error: 'Review ID is required' });
      return;
    }

    const review = await moderationService.hideReview(reviewId, req.user.userId, reason);

    res.status(200).json({
      message: 'Review hidden successfully',
      review: {
        reviewId: review.reviewId,
        isHidden: review.isHidden,
      },
    });
  } catch (error) {
    console.error('Error hiding review:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to hide review' });
    }
  }
};

/**
 * Unhide a review (admin only)
 */
export const unhideReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { reviewId } = req.params;

    if (!reviewId) {
      res.status(400).json({ error: 'Review ID is required' });
      return;
    }

    const review = await moderationService.unhideReview(reviewId, req.user.userId);

    res.status(200).json({
      message: 'Review unhidden successfully',
      review: {
        reviewId: review.reviewId,
        isHidden: review.isHidden,
      },
    });
  } catch (error) {
    console.error('Error unhiding review:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to unhide review' });
    }
  }
};

/**
 * Lock a task (admin only)
 */
export const lockTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { taskId } = req.params;
    const { reason, reportId } = req.body;

    if (!taskId || !reason) {
      res.status(400).json({ error: 'Task ID and reason are required' });
      return;
    }

    const task = await moderationService.lockTask(taskId, req.user.userId, reason, reportId);

    res.status(200).json({
      message: 'Task locked successfully',
      task: {
        taskId: task.taskId,
        isLocked: task.isLocked,
        lockedReason: task.lockedReason,
      },
    });
  } catch (error) {
    console.error('Error locking task:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to lock task' });
    }
  }
};

/**
 * Unlock a task (admin only)
 */
export const unlockTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { taskId } = req.params;

    if (!taskId) {
      res.status(400).json({ error: 'Task ID is required' });
      return;
    }

    const task = await moderationService.unlockTask(taskId, req.user.userId);

    res.status(200).json({
      message: 'Task unlocked successfully',
      task: {
        taskId: task.taskId,
        isLocked: task.isLocked,
      },
    });
  } catch (error) {
    console.error('Error unlocking task:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to unlock task' });
    }
  }
};

/**
 * Lock a contract (admin only)
 */
export const lockContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { contractId } = req.params;
    const { reason, reportId } = req.body;

    if (!contractId || !reason) {
      res.status(400).json({ error: 'Contract ID and reason are required' });
      return;
    }

    const contract = await moderationService.lockContract(
      contractId,
      req.user.userId,
      reason,
      reportId
    );

    res.status(200).json({
      message: 'Contract locked successfully',
      contract: {
        contractId: contract.contractId,
        isLocked: contract.isLocked,
        lockedReason: contract.lockedReason,
      },
    });
  } catch (error) {
    console.error('Error locking contract:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to lock contract' });
    }
  }
};

/**
 * Unlock a contract (admin only)
 */
export const unlockContract = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const contract = await moderationService.unlockContract(contractId, req.user.userId);

    res.status(200).json({
      message: 'Contract unlocked successfully',
      contract: {
        contractId: contract.contractId,
        isLocked: contract.isLocked,
      },
    });
  } catch (error) {
    console.error('Error unlocking contract:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to unlock contract' });
    }
  }
};

/**
 * Trigger refund (admin only)
 */
export const triggerRefund = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { contractId } = req.params;
    const { amount, reason, reportId } = req.body;

    if (!contractId || !reason) {
      res.status(400).json({ error: 'Contract ID and reason are required' });
      return;
    }

    const contract = await moderationService.triggerRefund(
      contractId,
      req.user.userId,
      amount || null,
      reason,
      reportId
    );

    res.status(200).json({
      message: 'Refund triggered successfully',
      contract: {
        contractId: contract.contractId,
        refundId: contract.refundId,
      },
    });
  } catch (error) {
    console.error('Error triggering refund:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to trigger refund' });
    }
  }
};

/**
 * Get audit logs (admin only)
 */
export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      page = '1',
      limit = '50',
      adminId,
      entityType,
      action,
      startDate,
      endDate,
    } = req.query;

    const result = await auditService.getAuditLogs({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      adminId: adminId as string | undefined,
      entityType: entityType as string | undefined,
      action: action as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

