import { Server as SocketIOServer } from 'socket.io';
import { getThreadRoom, getUserRoom } from '../config/socket';
import { ChatMessage, ChatThread } from './chat.service';

/**
 * Socket.IO service for emitting real-time events
 */
export class SocketService {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Emit a new message event to thread participants
   */
  emitNewMessage(threadId: string, message: ChatMessage): void {
    const room = getThreadRoom(threadId);
    this.io.to(room).emit('chat:message:new', {
      threadId,
      message,
    });
  }

  /**
   * Emit thread created event
   */
  emitThreadCreated(thread: ChatThread): void {
    // Notify both poster and helper
    const posterRoom = getUserRoom(thread.posterId);
    const helperRoom = getUserRoom(thread.helperId);

    this.io.to(posterRoom).emit('chat:thread:created', { thread });
    this.io.to(helperRoom).emit('chat:thread:created', { thread });
  }

  /**
   * Emit message read event
   */
  emitMessageRead(threadId: string, userId: string, count: number): void {
    const room = getThreadRoom(threadId);
    this.io.to(room).emit('chat:message:read', {
      threadId,
      userId,
      readCount: count,
    });
  }

  /**
   * Emit a new notification event to a specific user
   */
  emitNewNotification(userId: string, notification: {
    notificationId: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    relatedTaskId: string | null;
    relatedThreadId: string | null;
    relatedBidId: string | null;
    metadata: any;
    createdAt: Date;
  }): void {
    const userRoom = getUserRoom(userId);
    this.io.to(userRoom).emit('notification:new', {
      notification,
    });
  }

  /**
   * Emit notification read event
   */
  emitNotificationRead(userId: string, notificationId: string): void {
    const userRoom = getUserRoom(userId);
    this.io.to(userRoom).emit('notification:read', {
      notificationId,
    });
  }

  /**
   * Handle socket connection
   */
  handleConnection(socket: any): void {
    const userId = socket.userId;

    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`Socket connected: User ${userId}`);

    // Join user's personal room for notifications
    const userRoom = getUserRoom(userId);
    socket.join(userRoom);

    // Handle joining thread rooms
    socket.on('chat:thread:join', (threadId: string) => {
      const room = getThreadRoom(threadId);
      socket.join(room);
      console.log(`User ${userId} joined thread room: ${room}`);
    });

    // Handle leaving thread rooms
    socket.on('chat:thread:leave', (threadId: string) => {
      const room = getThreadRoom(threadId);
      socket.leave(room);
      console.log(`User ${userId} left thread room: ${room}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: User ${userId}`);
    });
  }
}

// Singleton instance (will be initialized in index.ts)
let socketServiceInstance: SocketService | null = null;

export const initializeSocketService = (io: SocketIOServer): SocketService => {
  if (!socketServiceInstance) {
    socketServiceInstance = new SocketService(io);
    
    // Set up connection handlers
    io.on('connection', (socket) => {
      socketServiceInstance!.handleConnection(socket);
    });
  }
  return socketServiceInstance;
};

export const getSocketService = (): SocketService => {
  if (!socketServiceInstance) {
    throw new Error('SocketService not initialized. Call initializeSocketService first.');
  }
  return socketServiceInstance;
};

