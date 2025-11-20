import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationBadge from '@/components/notifications/NotificationBadge';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import NotificationToast from '@/components/notifications/NotificationToast';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const {
    unreadCount,
    currentToast,
    showNotificationCenter,
    setShowNotificationCenter,
    dismissToast,
  } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 700, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            JiffyJobs
          </Typography>

          {isAuthenticated ? (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <Button color="inherit" onClick={() => navigate('/dashboard')}>
      Dashboard
    </Button>
    <Button color="inherit" onClick={() => navigate('/discover')}>
      Discover Tasks
    </Button>
    <Button color="inherit" onClick={() => navigate('/my-tasks')}>
      My Tasks
    </Button>
    <Button color="inherit" onClick={() => navigate('/my-bids')}>
      My Bids
    </Button>
    <NotificationBadge count={unreadCount}>
      <IconButton
        color="inherit"
        onClick={() => setShowNotificationCenter(true)}
      >
        <NotificationsIcon />
      </IconButton>
    </NotificationBadge>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <PersonIcon fontSize="small" />
      <Typography variant="body2">
        {user?.name || user?.email}
      </Typography>
    </Box>
    <Button
      color="inherit"
      startIcon={<LogoutIcon />}
      onClick={handleLogout}
    >
      Logout
    </Button>
  </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
      <NotificationCenter
        open={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />
      <NotificationToast
        notification={currentToast}
        onClose={dismissToast}
        onClick={() => {
          if (currentToast?.relatedTaskId) {
            navigate(`/task/${currentToast.relatedTaskId}`);
            dismissToast();
          }
        }}
      />
    </AppBar>
  );
};

export default Navbar;