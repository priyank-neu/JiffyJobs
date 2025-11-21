import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FlagIcon from '@mui/icons-material/Flag';
import { ChatMessage } from '@/types/chat.types';
import { useAuth } from '@/contexts/AuthContext';
import { chatAPI } from '@/services/api.service';
import ReportForm from '../reports/ReportForm';
import { ReportType } from '@/types/report.types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading = false }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, message: ChatMessage) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };

  const handleReport = () => {
    if (!selectedMessage) return;
    setShowReportDialog(true);
    handleMenuClose();
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (isLoading && messages.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading messages...
        </Typography>
      </Box>
    );
  }

  if (messages.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No messages yet. Start the conversation!
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {messages.map((message) => {
        const isOwnMessage = message.senderId === user?.userId;
        const senderName = message.sender?.name || message.sender?.email || 'Unknown';
        const initials = senderName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <Box
            key={message.messageId}
            sx={{
              display: 'flex',
              justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
              alignItems: 'flex-start',
              gap: 1,
            }}
          >
            {!isOwnMessage && (
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.75rem',
                }}
              >
                {initials}
              </Avatar>
            )}
            <Box
              sx={{
                maxWidth: '70%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 0.5,
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
                    color: isOwnMessage ? 'white' : 'text.primary',
                    borderRadius: 2,
                    flex: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {message.body}
                  </Typography>
                </Paper>
                {!isOwnMessage && (
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, message)}
                    sx={{
                      opacity: 0.7,
                      '&:hover': { opacity: 1 },
                      color: 'text.secondary',
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, fontSize: '0.7rem' }}
              >
                {dayjs(message.createdAt).fromNow()}
                {message.readAt && isOwnMessage && ' • Read'}
              </Typography>
            </Box>
            {isOwnMessage && (
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.75rem',
                }}
              >
                {user?.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || 'U'}
              </Avatar>
            )}
          </Box>
        );
      })}
      <div ref={messagesEndRef} />

      {/* Message Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleReport}>
          <FlagIcon sx={{ mr: 1, fontSize: '1rem' }} />
          Report Message
        </MenuItem>
      </Menu>

      {/* Report Dialog */}
      {selectedMessage && (
        <ReportForm
          open={showReportDialog}
          onClose={() => {
            setShowReportDialog(false);
            setSelectedMessage(null);
          }}
          onSuccess={() => {
            setShowReportDialog(false);
            setSelectedMessage(null);
            setSnackbar({
              open: true,
              message: 'Message reported successfully',
              severity: 'success',
            });
          }}
          type={ReportType.MESSAGE}
          targetId={selectedMessage.messageId}
          targetTitle={`Message from ${selectedMessage.sender?.name || selectedMessage.sender?.email || 'User'}`}
        />
      )}

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MessageList;


