import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Stack,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { Settings as SettingsIcon, Person, CreditCard, LocationOn, Star } from '@mui/icons-material';
import StripeConnectOnboarding from '@/components/payments/StripeConnectOnboarding';
import ProfileEdit from '@/components/profile/ProfileEdit';
import SkillsManager from '@/components/profile/SkillsManager';
import NeighborhoodVerification from '@/components/profile/NeighborhoodVerification';
import { profileAPI } from '@/services/api.service';
import { UserProfile } from '@/types/profile.types';

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getMyProfile();
      setProfile(response.profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SettingsIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4">Settings</Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<Person />} iconPosition="start" label="Profile" />
          <Tab icon={<Star />} iconPosition="start" label="Skills" />
          <Tab icon={<LocationOn />} iconPosition="start" label="Neighborhood" />
          <Tab icon={<CreditCard />} iconPosition="start" label="Payments" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Stack spacing={3}>
          <ProfileEdit />
        </Stack>
      )}

      {tabValue === 1 && (
        <Stack spacing={3}>
          <SkillsManager profile={profile} onUpdate={fetchProfile} />
        </Stack>
      )}

      {tabValue === 2 && (
        <Stack spacing={3}>
          <NeighborhoodVerification profile={profile} onUpdate={fetchProfile} />
        </Stack>
      )}

      {tabValue === 3 && (
        <Stack spacing={3}>
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
      )}
    </Container>
  );
};

export default Settings;

