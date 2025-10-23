import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create a new task
router.post('/', taskController.createTask);

// Get my tasks
router.get('/my-tasks', taskController.getMyTasks);

// Get task by ID
router.get('/:taskId', taskController.getTask);

// Update task
router.put('/:taskId', taskController.updateTask);

// Cancel task
router.patch('/:taskId/cancel', taskController.cancelTask);

// Delete task
router.delete('/:taskId', taskController.deleteTask);

export default router;