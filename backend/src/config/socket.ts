import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../utils/jwt.util';
import config from './env';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

/**
 * Initialize Socket.IO server with authentication
 */
export const initializeSocketIO = (httpServer: HTTPServer): SocketIOServer => {
  // CORS configuration for Socket.IO - allow Vercel preview URLs and production
  const allowedOrigins = [
    config.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    /^https:\/\/.*\.vercel\.app$/,
  ];

  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        return callback(null, true);
      }
      
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return origin === allowedOrigin;
        }
        if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST'],
  };

  const io = new SocketIOServer(httpServer, {
    cors: corsOptions,
    path: '/socket.io',
  });

  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
      const token = socket.handshake.auth?.token || 
                   socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
                   socket.handshake.query?.token as string;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = verifyToken(token);
        if (!decoded) {
          return next(new Error('Authentication error: Invalid token'));
        }

        // Attach user info to socket
        (socket as any).userId = decoded.userId;
        (socket as any).email = decoded.email;
        next();
      } catch (error) {
        next(new Error('Authentication error: Token verification failed'));
      }
    });

  return io;
};

/**
 * Get room name for a chat thread
 */
export const getThreadRoom = (threadId: string): string => {
  return `thread:${threadId}`;
};

/**
 * Get room name for a user (for user-specific notifications)
 */
export const getUserRoom = (userId: string): string => {
  return `user:${userId}`;
};

