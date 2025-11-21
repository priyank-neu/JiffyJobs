import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Box,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import {
  AccountBalance,
  CheckCircle,
  Error as ErrorIcon,
  Launch,
} from '@mui/icons-material';
import { paymentAPI } from '@/services/api.service';

interface StripeConnectOnboardingProps {
  onComplete?: () => void;
}

const StripeConnectOnboarding: React.FC<StripeConnectOnboardingProps> = ({
  onComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAccountStatus();
  }, []);

  const checkAccountStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await paymentAPI.getConnectAccountStatus();
      if (response.status) {
        setStatus(response.status);
        if (response.status.detailsSubmitted && response.status.chargesEnabled && response.status.payoutsEnabled) {
          // Account is fully set up
          if (onComplete) {
            onComplete();
          }
        }
      }
    } catch (err: any) {
      console.error('Error checking account status:', err);
      // Account might not exist yet, which is fine
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentAPI.createConnectAccount();
      setAccountId(response.accountId);
      setOnboardingUrl(response.onboardingUrl);
      
      // Open onboarding in new window
      if (response.onboardingUrl) {
        window.open(response.onboardingUrl, '_blank');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create Stripe Connect account');
      console.error('Error creating account:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueOnboarding = () => {
    if (onboardingUrl) {
      window.open(onboardingUrl, '_blank');
    } else {
      // Try to get the onboarding URL again
      handleCreateAccount();
    }
  };

  const isComplete = status?.detailsSubmitted && status?.chargesEnabled && status?.payoutsEnabled;

  if (checkingStatus) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccountBalance color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h6">Stripe Connect Setup</Typography>
              <Typography variant="body2" color="text.secondary">
                Connect your account to receive payouts
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {isComplete ? (
            <Alert
              severity="success"
              icon={<CheckCircle />}
              action={
                <Chip
                  label="Connected"
                  color="success"
                  size="small"
                  icon={<CheckCircle />}
                />
              }
            >
              Your Stripe Connect account is fully set up and ready to receive payouts!
            </Alert>
          ) : status ? (
            <Alert severity="warning">
              Your account setup is incomplete. Please complete the onboarding process.
              <Button
                size="small"
                startIcon={<Launch />}
                onClick={handleContinueOnboarding}
                sx={{ ml: 2 }}
              >
                Continue Setup
              </Button>
            </Alert>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                To receive payments as a helper, you need to connect your Stripe account.
                This is a secure process that takes just a few minutes.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={handleCreateAccount}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <AccountBalance />}
              >
                {loading ? 'Creating Account...' : 'Connect Stripe Account'}
              </Button>
            </Box>
          )}

          {onboardingUrl && !isComplete && (
            <Alert severity="info">
              <Typography variant="body2" gutterBottom>
                Complete your account setup in the window that opened, or click below to continue.
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Launch />}
                onClick={handleContinueOnboarding}
                sx={{ mt: 1 }}
              >
                Open Setup Page
              </Button>
            </Alert>
          )}

          {accountId && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={checkAccountStatus}
                disabled={checkingStatus}
              >
                {checkingStatus ? <CircularProgress size={20} /> : 'Refresh Status'}
              </Button>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default StripeConnectOnboarding;

