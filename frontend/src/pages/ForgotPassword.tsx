import React, { useState } from 'react';
import { Box, Container, Paper, Typography, Alert, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { authAPI } from '@/services/api.service';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.forgotPassword({ email });
      setSuccess(true);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } } };
      setError(apiError.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

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
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Forgot Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your email and we'll send you a reset link
          </Typography>

          {success ? (
            <Alert severity="success">
              If an account exists with that email, you will receive a password reset link shortly.
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                loading={loading}
              >
                Send Reset Link
              </Button>
            </Box>
          )}

          <Box sx={{ mt: 2, textAlign: 'center' }}>
  <Link component={RouterLink} to="/login" underline="none">
    <Button variant="text">
      Back to Login
    </Button>
  </Link>
</Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPassword;