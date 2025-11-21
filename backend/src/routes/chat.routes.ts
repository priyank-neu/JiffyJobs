import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
// Note: Rate limiting temporarily removed due to IPv6 validation issues
// Will implement per-user rate limiting in service layer if needed
// import { messageRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// Thread management
router.post('/threads', chatController.getOrCreateThread);
router.get('/threads', chatController.getUserThreads);
router.get('/threads/:threadId', chatController.getThreadById);

// Message management
router.post(
  '/messages',
  // messageRateLimiter, // Temporarily disabled - rate limiting can be added in service layer
  chatController.sendMessage
);
router.get('/threads/:threadId/messages', chatController.getThreadMessages);
router.patch('/threads/:threadId/read', chatController.markMessagesAsRead);

// Message reporting
router.post('/messages/:messageId/report', chatController.reportMessage);

export default router;

