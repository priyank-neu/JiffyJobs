import prisma from '../config/database';
import { NotificationType } from '@prisma/client';
import { sendNotificationEmail } from './email.service';
import config from '../config/env';
import { getSocketService } from './socket.service';

// In-memory cache for email throttling
// Key: userId, Value: { lastEmailSent: Date, pendingNotifications: Array }
const emailThrottleCache = new Map<
  string,
  { lastEmailSent: Date; pendingNotifications: Array<{ type: NotificationType; title: string; message: string }> }
>();

// Email throttling: Don't send more than one email per 5 minutes per user
// This ensures offline users receive email notifications within 5 minutes
const EMAIL_THROTTLE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedTaskId?: string;
  relatedThreadId?: string;
  relatedBidId?: string;
  metadata?: Record<string, any>;
  sendEmail?: boolean; // Whether to send email notification (default: true)
}

/**
 * Create an in-app notification
 * Optionally sends email notification with throttling
 */
export const createNotification = async (
  params: CreateNotificationParams
): Promise<{
  notificationId: string;
  createdAt: Date;
  emailSent: boolean;
}> => {
  const {
    userId,
    type,
    title,
    message,
    relatedTaskId,
    relatedThreadId,
    relatedBidId,
    metadata,
    sendEmail = true,
  } = params;

  // Create in-app notification
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      relatedTaskId,
      relatedThreadId,
      relatedBidId,
      metadata: metadata ? metadata : undefined,
    },
  });

  // Handle email notification with throttling
  let emailSent = false;
  if (sendEmail) {
    emailSent = await scheduleEmailNotification(userId, type, title, message, relatedTaskId);
  }

  // Emit Socket.IO event for real-time notification delivery
  try {
    const socketService = getSocketService();
    socketService.emitNewNotification(userId, {
      notificationId: notification.notificationId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      relatedTaskId: notification.relatedTaskId,
      relatedThreadId: notification.relatedThreadId,
      relatedBidId: notification.relatedBidId,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
    });
  } catch (error) {
    // Socket service might not be initialized yet, that's okay
    // Notifications will still be stored and can be retrieved via REST API
    console.warn('Socket service not available, notification saved but not emitted:', error);
  }

  return {
    notificationId: notification.notificationId,
    createdAt: notification.createdAt,
    emailSent,
  };
};

/**
 * Schedule email notification with throttling
 * Groups notifications within a time window to avoid spam
 */
const scheduleEmailNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedTaskId?: string
): Promise<boolean> => {
  const now = new Date();
  const userThrottle = emailThrottleCache.get(userId);

  // Check if we should send email immediately or throttle
  if (!userThrottle) {
    // First notification for this user - send immediately
    emailThrottleCache.set(userId, {
      lastEmailSent: now,
      pendingNotifications: [],
    });
    return await sendEmailNotification(userId, type, title, message, relatedTaskId);
  }

  const timeSinceLastEmail = now.getTime() - userThrottle.lastEmailSent.getTime();

  if (timeSinceLastEmail >= EMAIL_THROTTLE_WINDOW_MS) {
    // Enough time has passed - send email immediately
    // If there are pending notifications, include them in the email
    if (userThrottle.pendingNotifications.length > 0) {
      // Send grouped email with all pending notifications
      await sendGroupedEmailNotification(userId, [
        ...userThrottle.pendingNotifications,
        { type, title, message },
      ]);
      userThrottle.pendingNotifications = [];
    } else {
      // Send single notification email
      await sendEmailNotification(userId, type, title, message, relatedTaskId);
    }
    userThrottle.lastEmailSent = now;
    return true;
  } else {
    // Still within throttle window - queue notification
    userThrottle.pendingNotifications.push({ type, title, message });
    return false; // Email not sent yet, will be sent later
  }
};

/**
 * Send a single notification email
 */
const sendEmailNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedTaskId?: string
): Promise<boolean> => {
  try {
    // Get user email
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { email: true, name: true },
    });

    if (!user || !user.email) {
      console.warn(`Cannot send email notification: User ${userId} not found or has no email`);
      return false;
    }

    // Build notification URL if task is related
    let notificationUrl = `${config.FRONTEND_URL}/notifications`;
    if (relatedTaskId) {
      notificationUrl = `${config.FRONTEND_URL}/tasks/${relatedTaskId}`;
    }

    await sendNotificationEmail(user.email, user.name || 'User', title, message, notificationUrl);
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
};

/**
 * Send a grouped email notification with multiple notifications
 */
const sendGroupedEmailNotification = async (
  userId: string,
  notifications: Array<{ type: NotificationType; title: string; message: string }>
): Promise<boolean> => {
  try {
    // Get user email
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { email: true, name: true },
    });

    if (!user || !user.email) {
      console.warn(`Cannot send grouped email notification: User ${userId} not found or has no email`);
      return false;
    }

    // Build grouped email content
    const notificationList = notifications
      .map((n) => `• ${n.title}: ${n.message}`)
      .join('\n');

    const title = `You have ${notifications.length} new notification${notifications.length > 1 ? 's' : ''} on JiffyJobs`;
    const message = `You have new updates:\n\n${notificationList}`;

    await sendNotificationEmail(user.email, user.name || 'User', title, message, `${config.FRONTEND_URL}/notifications`);
    return true;
  } catch (error) {
    console.error('Error sending grouped notification email:', error);
    return false;
  }
};

/**
 * Get notifications for a user with pagination
 */
export const getUserNotifications = async (
  userId: string,
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<{
  notifications: Array<{
    notificationId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    relatedTaskId: string | null;
    relatedThreadId: string | null;
    relatedBidId: string | null;
    metadata: any;
    createdAt: Date;
    readAt: Date | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  unreadCount: number;
}> => {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = { userId };
  if (unreadOnly) {
    where.isRead = false;
  }

  // Get notifications and total count
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    unreadCount,
  };
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
): Promise<{ notificationId: string; isRead: boolean; readAt: Date }> => {
  // Verify notification belongs to user
  const notification = await prisma.notification.findUnique({
    where: { notificationId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  if (notification.userId !== userId) {
    throw new Error('Unauthorized: This notification does not belong to you');
  }

  if (notification.isRead) {
    // Already read, return as-is
    return {
      notificationId: notification.notificationId,
      isRead: notification.isRead,
      readAt: notification.readAt || new Date(),
    };
  }

  // Mark as read
  const updated = await prisma.notification.update({
    where: { notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  // Emit Socket.IO event for notification read status
  try {
    const socketService = getSocketService();
    socketService.emitNotificationRead(userId, notificationId);
  } catch (error) {
    // Socket service might not be initialized yet, that's okay
    console.warn('Socket service not available, read status not emitted:', error);
  }

  return {
    notificationId: updated.notificationId,
    isRead: updated.isRead,
    readAt: updated.readAt!,
  };
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<{ count: number }> => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { count: result.count };
};

