import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
 
const router = Router();
 
// Public route for viewing task details (for discovery)
router.get('/public/:taskId', taskController.getTask);
 
// All other routes require authentication
router.use(authenticate);
 
// Create a new task
router.post('/', taskController.createTask);
 
// Get my tasks
router.get('/my-tasks', taskController.getMyTasks);
 
// Get specific task (authenticated)
router.get('/:taskId', taskController.getTask);
 
// Update task
router.put('/:taskId', taskController.updateTask);
 
// Cancel task
router.patch('/:taskId/cancel', taskController.cancelTask);

// Complete task
router.patch('/:taskId/complete', taskController.completeTask);

// Delete task
router.delete('/:taskId', taskController.deleteTask);
 
export default router;