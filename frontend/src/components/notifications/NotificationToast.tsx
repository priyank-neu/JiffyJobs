import React, { useEffect } from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';
import { Notification } from '@/types/notification.types';

interface NotificationToastProps {
  notification: Notification | null;
  onClose: () => void;
  onClick?: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onClick,
}) => {
  useEffect(() => {
    if (notification) {
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const getSeverity = (type: string): 'info' | 'success' | 'warning' | 'error' => {
    switch (type) {
      case 'NEW_MESSAGE':
        return 'info';
      case 'BID_ACCEPTED':
      case 'HELPER_ASSIGNED':
      case 'CONTRACT_CREATED':
        return 'success';
      case 'TASK_UPDATED':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <Snackbar
      open={!!notification}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      onClick={onClick}
      sx={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <Alert
        onClose={onClose}
        severity={getSeverity(notification.type)}
        variant="filled"
        sx={{ minWidth: '300px' }}
      >
        <AlertTitle>{notification.title}</AlertTitle>
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationToast;


