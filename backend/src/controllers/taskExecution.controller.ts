// src/controllers/taskExecution.controller.ts

import { Response } from 'express';
import { AuthRequest } from '../types';
import * as taskExecutionService from '../services/taskExecution.service';

/**
 * POST /api/tasks/:taskId/start
 * Helper starts work on assigned task
 */
export async function startTask(req: AuthRequest, res: Response) {
  try {
    const { taskId } = req.params;
    const helperId = req.user?.userId;

    if (!helperId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const task = await taskExecutionService.startTask(taskId, helperId);

    res.json({
      message: 'Task started successfully',
      task,
    });
  } catch (error: any) {
    console.error('Start task error:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * POST /api/tasks/:taskId/complete
 * Helper marks task as complete
 */
export async function completeTask(req: AuthRequest, res: Response) {
  try {
    const { taskId } = req.params;
    const { notes } = req.body;
    const helperId = req.user?.userId;

    if (!helperId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const task = await taskExecutionService.completeTask(taskId, helperId, notes);

    res.json({
      message: 'Task marked as complete. Awaiting poster confirmation.',
      task,
    });
  } catch (error: any) {
    console.error('Complete task error:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * POST /api/tasks/:taskId/confirm
 * Poster confirms task completion
 */
export async function confirmCompletion(req: AuthRequest, res: Response) {
  try {
    const { taskId } = req.params;
    const { notes } = req.body;
    const posterId = req.user?.userId;

    if (!posterId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const task = await taskExecutionService.confirmCompletion(taskId, posterId, notes);

    res.json({
      message: 'Task completion confirmed. Payment will be released.',
      task,
    });
  } catch (error: any) {
    console.error('Confirm completion error:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * POST /api/tasks/:taskId/cancel
 * Cancel task before work starts
 */
export async function cancelTask(req: AuthRequest, res: Response) {
  try {
    const { taskId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Cancellation reason is required' });
    }

    // Check if user is helper or poster
    const task = await taskExecutionService.cancelTask(taskId, userId, reason, false);

    res.json({
      message: 'Task cancelled successfully',
      task,
    });
  } catch (error: any) {
    console.error('Cancel task error:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * GET /api/tasks/:taskId/timeline
 * Get task event timeline/history
 */
export async function getTimeline(req: AuthRequest, res: Response) {
  try {
    const { taskId } = req.params;

    const timeline = await taskExecutionService.getTaskTimeline(taskId);

    res.json({
      timeline,
    });
  } catch (error: any) {
    console.error('Get timeline error:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * POST /api/tasks/auto-confirm (internal/cron job endpoint)
 * Auto-confirm tasks that need it
 */
export async function autoConfirmTasks(req: AuthRequest, res: Response) {
  try {
    const { hoursThreshold = 24 } = req.body;

    // Get tasks needing confirmation
    const tasks = await taskExecutionService.getTasksNeedingAutoConfirm(hoursThreshold);

    // Auto-confirm each one
    const results = [];
    for (const task of tasks) {
      try {
        const confirmed = await taskExecutionService.autoConfirmTask(task.taskId, hoursThreshold);
        results.push({
          taskId: task.taskId,
          status: 'confirmed',
          task: confirmed,
        });
      } catch (error: any) {
        results.push({
          taskId: task.taskId,
          status: 'failed',
          error: error.message,
        });
      }
    }

    res.json({
      message: `Auto-confirmed ${results.filter(r => r.status === 'confirmed').length} tasks`,
      results,
    });
  } catch (error: any) {
    console.error('Auto-confirm tasks error:', error);
    res.status(500).json({ error: error.message });
  }
}