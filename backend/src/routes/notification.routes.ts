import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Get notifications for the authenticated user
router.get('/', notificationController.getNotifications);

// Mark a specific notification as read
router.patch('/:notificationId/read', notificationController.markNotificationAsRead);

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllNotificationsAsRead);

export default router;


