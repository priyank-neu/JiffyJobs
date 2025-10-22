import React, { useState } from 'react';
import { Box, Typography, Link, Alert } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Welcome Back
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Sign in to continue to JiffyJobs
      </Typography>

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
        sx={{ mb: 2 }}
        autoComplete="email"
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        sx={{ mb: 1 }}
        autoComplete="current-password"
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Link component={RouterLink} to="/forgot-password" variant="body2">
          Forgot password?
        </Link>
      </Box>

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        loading={loading}
        sx={{ mb: 2 }}
      >
        Sign In
      </Button>

      <Typography variant="body2" align="center">
        Don't have an account?{' '}
        <Link component={RouterLink} to="/signup" fontWeight="medium">
          Sign up
        </Link>
      </Typography>
    </Box>
  );
};

export default LoginForm;