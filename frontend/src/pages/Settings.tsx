import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Divider,
  Stack,
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import StripeConnectOnboarding from '@/components/payments/StripeConnectOnboarding';

const Settings: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SettingsIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4">Settings</Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" gutterBottom>
              Payment Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Connect your Stripe account to receive payouts when you complete tasks as a helper.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <StripeConnectOnboarding
                onComplete={() => {
                  console.log('Stripe Connect onboarding completed!');
                }}
              />
            </Box>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Settings;

