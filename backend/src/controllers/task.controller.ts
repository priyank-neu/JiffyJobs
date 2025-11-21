import { Response } from 'express';
import { AuthRequest } from '../types';
import * as taskService from '../services/task.service';
import { CreateTaskDTO, UpdateTaskDTO } from '../types/task.types';
 
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
 
    const taskData: CreateTaskDTO = req.body;
 
    // Validation
    if (!taskData.title || !taskData.description || !taskData.category || !taskData.budget) {
      res.status(400).json({ error: 'Missing required fields: title, description, category, budget' });
      return;
    }
 
    const task = await taskService.createTask(req.user.userId, taskData);
 
    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
};
 
export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    
    // For public access (discovery), we don't need to check ownership
    const task = await taskService.getTaskById(taskId, true);
 
    res.status(200).json({ task });
  } catch (error) {
    if (error instanceof Error) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  }
};
 
export const getMyTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
 
    const filters = {
      status: req.query.status as any,
      category: req.query.category as any,
    };
 
    const tasks = await taskService.getMyTasks(req.user.userId, filters);
 
    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};
 
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
 
    const { taskId } = req.params;
    const updateData: UpdateTaskDTO = req.body;
 
    const task = await taskService.updateTask(taskId, req.user.userId, updateData);
 
    res.status(200).json({
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
};
 
export const cancelTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
 
    const { taskId } = req.params;
 
    const task = await taskService.cancelTask(taskId, req.user.userId);
 
    res.status(200).json({
      message: 'Task cancelled successfully',
      task,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to cancel task' });
    }
  }
};
 
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { taskId } = req.params;

    await taskService.deleteTask(taskId, req.user.userId);

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
};

export const completeTask = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { autoRelease } = req.query;
    const autoReleaseBool = typeof autoRelease === 'string' && (autoRelease === 'true' || autoRelease === '1');

    const task = await taskService.completeTask(taskId, req.user.userId, autoReleaseBool);

    if (!task) {
      res.status(404).json({ error: 'Task not found after completion' });
      return;
    }

    res.status(200).json({
      message: 'Task completed successfully',
      task,
    });
  } catch (error) {
    console.error('Error completing task:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to complete task' });
    }
  }
};