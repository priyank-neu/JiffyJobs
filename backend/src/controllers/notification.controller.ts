import { Response } from 'express';
import { AuthRequest } from '../types';
import * as notificationService from '../services/notification.service';

/**
 * Get notifications for the authenticated user
 * GET /api/notifications?page=1&limit=20&unreadOnly=false
 */
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    // Validate pagination
    if (page < 1) {
      res.status(400).json({ error: 'Page must be greater than 0' });
      return;
    }
    if (limit < 1 || limit > 100) {
      res.status(400).json({ error: 'Limit must be between 1 and 100' });
      return;
    }

    const result = await notificationService.getUserNotifications(userId, page, limit, unreadOnly);

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};

/**
 * Mark a notification as read
 * PATCH /api/notifications/:notificationId/read
 */
export const markNotificationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { notificationId } = req.params;

    if (!notificationId) {
      res.status(400).json({ error: 'Notification ID is required' });
      return;
    }

    const result = await notificationService.markNotificationAsRead(userId, notificationId);

    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Notification not found') {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error.message.includes('Unauthorized')) {
      res.status(403).json({ error: error.message });
      return;
    }
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

/**
 * Mark all notifications as read for the authenticated user
 * PATCH /api/notifications/read-all
 */
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const result = await notificationService.markAllNotificationsAsRead(userId);

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

