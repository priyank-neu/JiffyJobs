import prisma from '../config/database';
import { TaskStatus, BidStatus, NotificationType } from '@prisma/client';
import { sanitizeMessage } from '../utils/validation.util';
import { getSocketService } from './socket.service';
import { createNotification } from './notification.service';

// Rate limiting configuration
const MESSAGE_RATE_LIMIT = 10; // Max messages per minute
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute in milliseconds

// In-memory cache for rate limiting
// Key: `${userId}:${threadId}`, Value: Array of timestamps
const messageRateLimitCache = new Map<string, number[]>();

/**
 * Check if user has exceeded message rate limit for a thread
 * Returns true if rate limit is exceeded, false otherwise
 */
const checkRateLimit = (userId: string, threadId: string): boolean => {
  const key = `${userId}:${threadId}`;
  const now = Date.now();
  
  // Get existing timestamps for this user+thread
  let timestamps = messageRateLimitCache.get(key) || [];
  
  // Remove timestamps older than 1 minute
  timestamps = timestamps.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  
  // Check if limit exceeded
  if (timestamps.length >= MESSAGE_RATE_LIMIT) {
    return true; // Rate limit exceeded
  }
  
  // Add current timestamp
  timestamps.push(now);
  messageRateLimitCache.set(key, timestamps);
  
  return false; // Within rate limit
};

/**
 * Clean up old rate limit entries periodically
 * This prevents memory leaks from stale entries
 */
const cleanupRateLimitCache = () => {
  const now = Date.now();
  for (const [key, timestamps] of messageRateLimitCache.entries()) {
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
    );
    
    if (validTimestamps.length === 0) {
      messageRateLimitCache.delete(key);
    } else {
      messageRateLimitCache.set(key, validTimestamps);
    }
  }
};

// Clean up cache every 5 minutes
setInterval(cleanupRateLimitCache, 5 * 60 * 1000);

export interface CreateChatThreadRequest {
  taskId: string;
  helperId: string;
}

export interface SendMessageRequest {
  threadId: string;
  body: string;
}

export interface ChatThread {
  threadId: string;
  taskId: string;
  posterId: string;
  helperId: string;
  createdAt: Date;
  updatedAt: Date;
  task?: {
    taskId: string;
    title: string;
    status: string;
  };
  poster?: {
    userId: string;
    name?: string;
    email: string;
  };
  helper?: {
    userId: string;
    name?: string;
    email: string;
  };
}

export interface ChatMessage {
  messageId: string;
  threadId: string;
  senderId: string;
  receiverId: string;
  body: string;
  readAt: Date | null;
  isDeleted: boolean;
  createdAt: Date;
  sender?: {
    userId: string;
    name?: string;
    email: string;
  };
  receiver?: {
    userId: string;
    name?: string;
    email: string;
  };
}

/**
 * Get or create a chat thread for a task and helper pair
 * Ensures only one thread exists per (taskId, helperId) pair
 */
export const getOrCreateThread = async (
  userId: string,
  request: CreateChatThreadRequest
): Promise<ChatThread> => {
  const { taskId, helperId } = request;

  // Verify task exists
  const task = await prisma.task.findUnique({
    where: { taskId },
    include: {
      poster: true,
      bids: {
        where: {
          helperId,
          status: BidStatus.PENDING,
        },
      },
      contract: true,
    },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  // Verify user is either poster or helper
  const isPoster = task.posterId === userId;
  const isHelper = helperId === userId;
  const isAssignedHelper = task.assignedHelperId === helperId;

  if (!isPoster && !isHelper) {
    throw new Error('Unauthorized: You must be the poster or helper for this task');
  }

  // Check if user is trying to chat with themselves
  if (task.posterId === helperId) {
    throw new Error('Cannot create chat thread with yourself');
  }

  // Verify helper has a bid or is assigned (chat can only start after bid exists or helper is assigned)
  const hasBid = task.bids.length > 0;
  const isAssigned = isAssignedHelper;

  if (!hasBid && !isAssigned) {
    throw new Error('Chat can only be started after a bid is placed or helper is assigned');
  }

  // Determine poster and helper IDs
  const posterId = task.posterId;
  const actualHelperId = isPoster ? helperId : userId;

  // Try to find existing thread
  let thread = await prisma.chatThread.findUnique({
    where: {
      taskId_helperId: {
        taskId,
        helperId: actualHelperId,
      },
    },
    include: {
      task: {
        select: {
          taskId: true,
          title: true,
          status: true,
        },
      },
      poster: {
        select: {
          userId: true,
          name: true,
          email: true,
        },
      },
      helper: {
        select: {
          userId: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Create thread if it doesn't exist
  if (!thread) {
    thread = await prisma.chatThread.create({
      data: {
        taskId,
        posterId,
        helperId: actualHelperId,
      },
      include: {
        task: {
          select: {
            taskId: true,
            title: true,
            status: true,
          },
        },
        poster: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
        helper: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Emit Socket.IO event for thread creation
    try {
      const socketService = getSocketService();
      socketService.emitThreadCreated(thread as ChatThread);
    } catch (error) {
      // Socket service might not be initialized yet, that's okay
      console.warn('Socket service not available, thread created but not emitted:', error);
    }
  }

  return thread as ChatThread;
};

/**
 * Send a message in a chat thread
 */
export const sendMessage = async (
  userId: string,
  request: SendMessageRequest
): Promise<ChatMessage> => {
  const { threadId, body } = request;

  // Validate and sanitize message
  const sanitizedBody = sanitizeMessage(body);
  if (!sanitizedBody || sanitizedBody.trim().length === 0) {
    throw new Error('Message body cannot be empty');
  }

  // Get thread and verify user is part of it
  const thread = await prisma.chatThread.findUnique({
    where: { threadId },
    include: {
      task: true,
    },
  });

  if (!thread) {
    throw new Error('Chat thread not found');
  }

  // Verify user is either poster or helper
  const isPoster = thread.posterId === userId;
  const isHelper = thread.helperId === userId;

  if (!isPoster && !isHelper) {
    throw new Error('Unauthorized: You are not part of this chat thread');
  }

  // Check rate limit (10 messages per minute per thread)
  if (checkRateLimit(userId, threadId)) {
    throw new Error(
      `Rate limit exceeded: Maximum ${MESSAGE_RATE_LIMIT} messages per minute allowed. Please wait a moment before sending another message.`
    );
  }

  // Determine sender and receiver
  const senderId = userId;
  const receiverId = isPoster ? thread.helperId : thread.posterId;

  // Create message
  const message = await prisma.chatMessage.create({
    data: {
      threadId,
      senderId,
      receiverId,
      body: sanitizedBody,
    },
    include: {
      sender: {
        select: {
          userId: true,
          name: true,
          email: true,
        },
      },
      receiver: {
        select: {
          userId: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Update thread's updatedAt timestamp
  await prisma.chatThread.update({
    where: { threadId },
    data: { updatedAt: new Date() },
  });

  // Emit Socket.IO event for real-time delivery
  try {
    const socketService = getSocketService();
    socketService.emitNewMessage(threadId, message as ChatMessage);
  } catch (error) {
    // Socket service might not be initialized yet, that's okay
    // Messages will still be stored and can be retrieved via REST API
    console.warn('Socket service not available, message saved but not emitted:', error);
  }

  // Create notification for the receiver
  try {
    const senderName = message.sender?.name || message.sender?.email || 'Someone';
    const taskTitle = thread.task?.title || 'a task';
    
    await createNotification({
      userId: receiverId,
      type: NotificationType.NEW_MESSAGE,
      title: 'New Message',
      message: `${senderName} sent you a message about "${taskTitle}"`,
      relatedTaskId: thread.taskId,
      relatedThreadId: threadId,
      sendEmail: true, // Send email notification with throttling
    });
  } catch (error) {
    // Notification creation failure shouldn't break message sending
    console.error('Error creating notification for new message:', error);
  }

  return message as ChatMessage;
};

/**
 * Get messages for a thread with pagination
 */
export const getThreadMessages = async (
  userId: string,
  threadId: string,
  page: number = 1,
  limit: number = 50
): Promise<{
  messages: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> => {
  // Verify thread exists and user is part of it
  const thread = await prisma.chatThread.findUnique({
    where: { threadId },
  });

  if (!thread) {
    throw new Error('Chat thread not found');
  }

  const isPoster = thread.posterId === userId;
  const isHelper = thread.helperId === userId;

  if (!isPoster && !isHelper) {
    throw new Error('Unauthorized: You are not part of this chat thread');
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get messages
  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where: {
        threadId,
        isDeleted: false,
      },
      include: {
        sender: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.chatMessage.count({
      where: {
        threadId,
        isDeleted: false,
      },
    }),
  ]);

  // Reverse to show oldest first (since we ordered by desc)
  const reversedMessages = messages.reverse();

  const totalPages = Math.ceil(total / limit);

  return {
    messages: reversedMessages as ChatMessage[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

/**
 * Get all chat threads for a user
 * Returns threads with last message, unread count, etc.
 */
export const getUserThreads = async (
  userId: string
): Promise<
  Array<
    ChatThread & {
      lastMessage?: ChatMessage | null;
      unreadCount: number;
    }
  >
> => {
  // Get all threads where user is poster or helper
  const threads = await prisma.chatThread.findMany({
    where: {
      OR: [{ posterId: userId }, { helperId: userId }],
    },
    include: {
      task: {
        select: {
          taskId: true,
          title: true,
          status: true,
        },
      },
      poster: {
        select: {
          userId: true,
          name: true,
          email: true,
        },
      },
      helper: {
        select: {
          userId: true,
          name: true,
          email: true,
        },
      },
      messages: {
        where: {
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        include: {
          sender: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
          receiver: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // For each thread, get unread count and last message
  const threadsWithMetadata = await Promise.all(
    threads.map(async (thread) => {
      // Get unread count (messages where receiver is current user and readAt is null)
      const unreadCount = await prisma.chatMessage.count({
        where: {
          threadId: thread.threadId,
          receiverId: userId,
          readAt: null,
          isDeleted: false,
        },
      });

      const lastMessage = thread.messages[0] || null;

      return {
        ...thread,
        lastMessage: lastMessage as ChatMessage | null,
        unreadCount,
      };
    })
  );

  return threadsWithMetadata as Array<
    ChatThread & {
      lastMessage?: ChatMessage | null;
      unreadCount: number;
    }
  >;
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (
  userId: string,
  threadId: string
): Promise<{ count: number }> => {
  // Verify thread exists and user is part of it
  const thread = await prisma.chatThread.findUnique({
    where: { threadId },
  });

  if (!thread) {
    throw new Error('Chat thread not found');
  }

  const isPoster = thread.posterId === userId;
  const isHelper = thread.helperId === userId;

  if (!isPoster && !isHelper) {
    throw new Error('Unauthorized: You are not part of this chat thread');
  }

  // Mark all unread messages as read
  const result = await prisma.chatMessage.updateMany({
    where: {
      threadId,
      receiverId: userId,
      readAt: null,
      isDeleted: false,
    },
    data: {
      readAt: new Date(),
    },
  });

  // Emit Socket.IO event for read status
  try {
    const socketService = getSocketService();
    socketService.emitMessageRead(threadId, userId, result.count);
  } catch (error) {
    // Socket service might not be initialized yet, that's okay
    console.warn('Socket service not available, read status not emitted:', error);
  }

  return { count: result.count };
};

/**
 * Get a specific thread by ID
 */
export const getThreadById = async (
  userId: string,
  threadId: string
): Promise<ChatThread> => {
  const thread = await prisma.chatThread.findUnique({
    where: { threadId },
    include: {
      task: {
        select: {
          taskId: true,
          title: true,
          status: true,
        },
      },
      poster: {
        select: {
          userId: true,
          name: true,
          email: true,
        },
      },
      helper: {
        select: {
          userId: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!thread) {
    throw new Error('Chat thread not found');
  }

  const isPoster = thread.posterId === userId;
  const isHelper = thread.helperId === userId;

  if (!isPoster && !isHelper) {
    throw new Error('Unauthorized: You are not part of this chat thread');
  }

  return thread as ChatThread;
};

