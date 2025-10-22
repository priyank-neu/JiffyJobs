import React from 'react';
import { Box, Container, Paper } from '@mui/material';
import LoginForm from '@/components/auth/LoginForm';

const Login: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <LoginForm />
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;