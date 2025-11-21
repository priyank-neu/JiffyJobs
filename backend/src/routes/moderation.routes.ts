import { Router } from 'express';
import * as moderationController from '../controllers/moderation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// All moderation routes require admin access
router.use(authenticate);
router.use(requireAdmin);

// User moderation
router.post('/users/:userId/suspend', moderationController.suspendUser);
router.post('/users/:userId/reactivate', moderationController.reactivateUser);

// Review moderation
router.post('/reviews/:reviewId/hide', moderationController.hideReview);
router.post('/reviews/:reviewId/unhide', moderationController.unhideReview);

// Task moderation
router.post('/tasks/:taskId/lock', moderationController.lockTask);
router.post('/tasks/:taskId/unlock', moderationController.unlockTask);

// Contract moderation
router.post('/contracts/:contractId/lock', moderationController.lockContract);
router.post('/contracts/:contractId/unlock', moderationController.unlockContract);

// Refund
router.post('/contracts/:contractId/refund', moderationController.triggerRefund);

// Audit logs
router.get('/audit-logs', moderationController.getAuditLogs);

export default router;

