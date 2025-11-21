import React from 'react';
import { Container, Typography, Box, Paper, Alert } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Welcome to JiffyJobs!
      </Typography>

      {!user?.isVerified && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          Please verify your email address. Check your inbox for the verification link.
        </Alert>
      )}

      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Account Information
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body1">{user?.name || 'Not provided'}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Email
            </Typography>
            <Typography variant="body1">{user?.email}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Email Verification Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {user?.isVerified ? (
                <>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="body1" color="success.main">
                    Verified
                  </Typography>
                </>
              ) : (
                <>
                  <WarningIcon color="warning" fontSize="small" />
                  <Typography variant="body1" color="warning.main">
                    Not Verified
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 4 }}>
  <Typography variant="h6" gutterBottom>
    Getting Started
  </Typography>
  <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
    🎉 Your account has been created successfully!
  </Typography>
  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
    Epic 1: User Authentication - Complete ✅
  </Typography>
  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
    Epic 2: Task Posting - In Progress 🚧
  </Typography>

  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
    <Button
      variant="contained"
      onClick={() => navigate('/tasks/create')}
    >
      Post a Task
    </Button>
    <Button
      variant="outlined"
      onClick={() => navigate('/my-tasks')}
    >
      View My Tasks
    </Button>
  </Box>
</Paper>
    </Container>
  );
};

export default Dashboard;