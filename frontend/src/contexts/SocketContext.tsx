import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { ChatMessage, ChatThread } from '@/types/chat.types';
import { Notification } from '@/types/notification.types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  // Chat event handlers
  onNewMessage: (callback: (data: { threadId: string; message: ChatMessage }) => void) => void;
  onThreadCreated: (callback: (data: { thread: ChatThread }) => void) => void;
  onMessageRead: (callback: (data: { threadId: string; userId: string; readCount: number }) => void) => void;
  // Notification event handlers
  onNewNotification: (callback: (data: { notification: Notification }) => void) => void;
  onNotificationRead: (callback: (data: { notificationId: string }) => void) => void;
  // Room management
  joinThreadRoom: (threadId: string) => void;
  leaveThreadRoom: (threadId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

// Socket.IO runs on the same port as the API server
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL.replace('/api', '');

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('token');

    if (!token) {
      return;
    }

    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket.IO connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('Socket.IO connection error:', error);
      setIsConnected(false);
      
      // If authentication error, clear token and redirect
      if (error.message?.includes('Authentication') || error.message?.includes('Invalid token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
          window.location.href = '/login';
        }
      }
    });

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  // Helper function to set up event listeners
  const onNewMessage = (callback: (data: { threadId: string; message: ChatMessage }) => void) => {
    if (socket) {
      socket.on('chat:message:new', callback);
      return () => {
        socket.off('chat:message:new', callback);
      };
    }
  };

  const onThreadCreated = (callback: (data: { thread: ChatThread }) => void) => {
    if (socket) {
      socket.on('chat:thread:created', callback);
      return () => {
        socket.off('chat:thread:created', callback);
      };
    }
  };

  const onMessageRead = (callback: (data: { threadId: string; userId: string; readCount: number }) => void) => {
    if (socket) {
      socket.on('chat:message:read', callback);
      return () => {
        socket.off('chat:message:read', callback);
      };
    }
  };

  const onNewNotification = (callback: (data: { notification: Notification }) => void) => {
    if (socket) {
      socket.on('notification:new', callback);
      return () => {
        socket.off('notification:new', callback);
      };
    }
  };

  const onNotificationRead = (callback: (data: { notificationId: string }) => void) => {
    if (socket) {
      socket.on('notification:read', callback);
      return () => {
        socket.off('notification:read', callback);
      };
    }
  };

  const joinThreadRoom = (threadId: string) => {
    if (socket && isConnected) {
      socket.emit('chat:thread:join', threadId);
    }
  };

  const leaveThreadRoom = (threadId: string) => {
    if (socket && isConnected) {
      socket.emit('chat:thread:leave', threadId);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    onNewMessage,
    onThreadCreated,
    onMessageRead,
    onNewNotification,
    onNotificationRead,
    joinThreadRoom,
    leaveThreadRoom,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

