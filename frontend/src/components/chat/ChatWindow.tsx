import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ChatMessage } from '@/types/chat.types';
import { chatAPI } from '@/services/api.service';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  threadId: string;
  taskTitle?: string;
  onClose?: () => void;
  counterpartName?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  threadId,
  taskTitle,
  onClose,
  counterpartName,
}) => {
  const { user } = useAuth();
  const { socket, isConnected, joinThreadRoom, leaveThreadRoom, onNewMessage } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load messages
  const loadMessages = useCallback(async (pageNum: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await chatAPI.getThreadMessages(threadId, pageNum, 50);
      setMessages(response.messages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Join thread room when connected
  useEffect(() => {
    if (isConnected && threadId) {
      joinThreadRoom(threadId);
      return () => {
        leaveThreadRoom(threadId);
      };
    }
  }, [isConnected, threadId, joinThreadRoom, leaveThreadRoom]);

  // Listen for new messages via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { threadId: string; message: ChatMessage }) => {
      if (data.threadId === threadId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.messageId === data.message.messageId)) {
            return prev;
          }
          return [...prev, data.message];
        });
        // Mark messages as read when receiving new message
        if (data.message.receiverId === user?.userId) {
          chatAPI.markMessagesAsRead(threadId).catch(console.error);
        }
      }
    };

    const cleanup = onNewMessage(handleNewMessage);
    return cleanup;
  }, [socket, threadId, user, onNewMessage]);

  // Polling fallback: Poll for new messages when Socket.IO is disconnected
  useEffect(() => {
    if (isConnected) return; // Don't poll if Socket.IO is connected

    const pollInterval = setInterval(async () => {
      try {
        const response = await chatAPI.getThreadMessages(threadId, 1, 50);
        const latestMessage = response.messages[response.messages.length - 1];
        
        if (latestMessage) {
          // Check if this is a new message we don't have
          setMessages((prev) => {
            if (prev.some((m) => m.messageId === latestMessage.messageId)) {
              return prev; // Already have it
            }
            // Add new message
            return [...prev, latestMessage];
          });
        }
      } catch (error) {
        console.error('Error polling for messages:', error);
      }
    }, 5000); // Poll every 5 seconds when offline

    return () => clearInterval(pollInterval);
  }, [isConnected, threadId]);

  // Send message
  const handleSendMessage = async (messageBody: string) => {
    if (!messageBody.trim() || isSending) return;

    try {
      setIsSending(true);
      setError(null);
      const newMessage = await chatAPI.sendMessage({
        threadId,
        body: messageBody,
      });
      setMessages((prev) => [...prev, newMessage]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '600px',
        maxHeight: '80vh',
        width: '100%',
        maxWidth: '600px',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="h6" component="div">
            {counterpartName || 'Chat'}
          </Typography>
          {taskTitle && (
            <Typography variant="caption" color="text.secondary">
              {taskTitle}
            </Typography>
          )}
        </Box>
        {onClose && (
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={isSending || !isConnected}
        placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
      />
    </Paper>
  );
};

export default ChatWindow;

