// ============================================
// src/routes/taskExecution.routes.ts
// ============================================

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as taskExecutionController from '../controllers/taskExecution.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Helper actions
router.post('/:taskId/start', taskExecutionController.startTask);
router.post('/:taskId/complete', taskExecutionController.completeTask);

// Poster actions
router.post('/:taskId/confirm', taskExecutionController.confirmCompletion);

// Both poster and helper can cancel
router.post('/:taskId/cancel', taskExecutionController.cancelTask);

// View timeline (anyone can view)
router.get('/:taskId/timeline', taskExecutionController.getTimeline);

// Background job endpoint (should be protected with API key in production)
router.post('/auto-confirm', taskExecutionController.autoConfirmTasks);

export default router;