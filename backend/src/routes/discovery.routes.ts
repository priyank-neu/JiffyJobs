import { Router } from 'express';
import * as discoveryController from '../controllers/discovery.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Discover tasks with location-based filtering
router.get('/tasks', discoveryController.discoverTasks);

// Get count of nearby tasks (for quick stats)
router.get('/tasks/count', discoveryController.getNearbyTasksCount);

export default router;
