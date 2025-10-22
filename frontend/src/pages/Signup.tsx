import React from 'react';
import { Box, Container, Paper } from '@mui/material';
import SignupForm from '@/components/auth/SignupForm';

const Signup: React.FC = () => {
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
          <SignupForm />
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;