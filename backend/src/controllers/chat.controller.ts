import { Response } from 'express';
import { AuthRequest } from '../types';
import * as chatService from '../services/chat.service';
import { isValidMessage } from '../utils/validation.util';

/**
 * Get or create a chat thread for a task and helper
 */
export const getOrCreateThread = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { taskId, helperId } = req.body;

    // Validation
    if (!taskId || !helperId) {
      res.status(400).json({ error: 'taskId and helperId are required' });
      return;
    }

    const thread = await chatService.getOrCreateThread(req.user.userId, {
      taskId,
      helperId,
    });

    res.status(200).json({
      message: 'Thread retrieved or created successfully',
      thread,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get or create thread' });
    }
  }
};

/**
 * Send a message in a chat thread
 */
export const sendMessage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { threadId, body } = req.body;

    // Validation
    if (!threadId || !body) {
      res.status(400).json({ error: 'threadId and body are required' });
      return;
    }

    if (!isValidMessage(body)) {
      res.status(400).json({
        error: 'Message body must be between 1 and 5000 characters',
      });
      return;
    }

    const message = await chatService.sendMessage(req.user.userId, {
      threadId,
      body,
    });

    res.status(201).json({
      message: 'Message sent successfully',
      chatMessage: message,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
};

/**
 * Get messages for a thread with pagination
 */
export const getThreadMessages = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { threadId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    // Validation
    if (!threadId) {
      res.status(400).json({ error: 'threadId is required' });
      return;
    }

    if (page < 1) {
      res.status(400).json({ error: 'Page must be greater than 0' });
      return;
    }

    if (limit < 1 || limit > 100) {
      res.status(400).json({ error: 'Limit must be between 1 and 100' });
      return;
    }

    const result = await chatService.getThreadMessages(
      req.user.userId,
      threadId,
      page,
      limit
    );

    res.status(200).json({
      message: 'Messages retrieved successfully',
      ...result,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  }
};

/**
 * Get all chat threads for the current user
 */
export const getUserThreads = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const threads = await chatService.getUserThreads(req.user.userId);

    res.status(200).json({
      message: 'Threads retrieved successfully',
      threads,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to retrieve threads' });
    }
  }
};

/**
 * Mark messages as read in a thread
 */
export const markMessagesAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { threadId } = req.params;

    if (!threadId) {
      res.status(400).json({ error: 'threadId is required' });
      return;
    }

    const result = await chatService.markMessagesAsRead(
      req.user.userId,
      threadId
    );

    res.status(200).json({
      message: 'Messages marked as read',
      ...result,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  }
};

/**
 * Get a specific thread by ID
 */
export const getThreadById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { threadId } = req.params;

    if (!threadId) {
      res.status(400).json({ error: 'threadId is required' });
      return;
    }

    const thread = await chatService.getThreadById(req.user.userId, threadId);

    res.status(200).json({
      message: 'Thread retrieved successfully',
      thread,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to retrieve thread' });
    }
  }
};

/**
 * Report a message
 */
export const reportMessage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { messageId } = req.params;
    const { reason } = req.body;

    if (!messageId) {
      res.status(400).json({ error: 'messageId is required' });
      return;
    }

    // Import prisma to check message access
    const prisma = (await import('../config/database')).default;
    const chatMessage = await prisma.chatMessage.findUnique({
      where: { messageId },
      include: {
        thread: true,
      },
    });

    if (!chatMessage) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    // Verify user is part of the thread
    const thread = chatMessage.thread;
    const isPoster = thread.posterId === req.user.userId;
    const isHelper = thread.helperId === req.user.userId;

    if (!isPoster && !isHelper) {
      res.status(403).json({
        error: 'Unauthorized: You are not part of this chat thread',
      });
      return;
    }

    // Check if user already reported this message
    const existingReport = await prisma.messageReport.findFirst({
      where: {
        messageId,
        reporterId: req.user.userId,
      },
    });

    if (existingReport) {
      res.status(400).json({ error: 'You have already reported this message' });
      return;
    }

    // Create report
    const report = await prisma.messageReport.create({
      data: {
        messageId,
        reporterId: req.user.userId,
        reason: reason || null,
      },
    });

    res.status(201).json({
      message: 'Message reported successfully',
      report,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to report message' });
    }
  }
};

