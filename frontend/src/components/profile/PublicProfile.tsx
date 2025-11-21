import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Rating,
  Divider,
  Container,
} from '@mui/material';
import {
  Verified,
  LocationOn,
  Star,
} from '@mui/icons-material';
import { profileAPI } from '@/services/api.service';
import { PublicProfile as PublicProfileType } from '@/types/profile.types';

interface PublicProfileProps {
  userId?: string;
}

const PublicProfile: React.FC<PublicProfileProps> = ({ userId: propUserId }) => {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const userId = propUserId || paramUserId;
  
  const [profile, setProfile] = useState<PublicProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await profileAPI.getPublicProfile(userId);
      setProfile(response.profile);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">User ID is required</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">Profile not found</Alert>
      </Container>
    );
  }

  const { ratingsSummary } = profile;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardContent>
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" spacing={3} alignItems="flex-start">
            <Avatar
              src={profile.avatarUrl || undefined}
              sx={{ width: 100, height: 100 }}
            >
              {profile.name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h5" fontWeight="bold">
                  {profile.name || 'Anonymous User'}
                </Typography>
                {profile.neighborhoodVerified && (
                  <Chip
                    icon={<Verified />}
                    label="Verified Neighborhood"
                    color="success"
                    size="small"
                  />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {profile.role}
              </Typography>
              {profile.preferredHourlyRate && (
                <Typography variant="body1" color="primary" sx={{ mt: 1 }}>
                  ${profile.preferredHourlyRate}/hour
                </Typography>
              )}
            </Box>
          </Stack>

          {/* Bio */}
          {profile.bio && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                About
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profile.bio}
              </Typography>
            </Box>
          )}

          <Divider />

          {/* Location (Masked) */}
          {profile.neighborhoodLocation && (
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <LocationOn color="action" />
                <Typography variant="subtitle2">Location</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {[
                  profile.neighborhoodLocation.city,
                  profile.neighborhoodLocation.state,
                  profile.neighborhoodLocation.zipCode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Approximate area only
              </Typography>
            </Box>
          )}

          {/* Skills */}
          {profile.userSkills && profile.userSkills.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Skills
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {profile.userSkills.map((userSkill) => (
                  <Chip
                    key={userSkill.userSkillId}
                    label={userSkill.skill.name}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Divider />

          {/* Ratings Summary */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Star color="primary" />
              <Typography variant="subtitle2">Ratings & Reviews</Typography>
            </Stack>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Rating value={ratingsSummary.averageRating} readOnly precision={0.1} />
                <Typography variant="h6">
                  {ratingsSummary.averageRating.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ({ratingsSummary.totalReviews} {ratingsSummary.totalReviews === 1 ? 'review' : 'reviews'})
                </Typography>
              </Stack>

              {ratingsSummary.totalReviews > 0 && (
                <Stack spacing={0.5}>
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = ratingsSummary.ratingDistribution[rating as keyof typeof ratingsSummary.ratingDistribution];
                    const percentage = ratingsSummary.totalReviews > 0
                      ? (count / ratingsSummary.totalReviews) * 100
                      : 0;
                    return (
                      <Stack key={rating} direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" sx={{ minWidth: 20 }}>
                          {rating}
                        </Typography>
                        <Star fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Box
                          sx={{
                            flex: 1,
                            height: 8,
                            bgcolor: 'background.default',
                            borderRadius: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${percentage}%`,
                              height: '100%',
                              bgcolor: 'primary.main',
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 30 }}>
                          {count}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Stats */}
          <Divider />
          <Stack direction="row" spacing={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Completed Tasks
              </Typography>
              <Typography variant="h6">
                {profile._count.contracts}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Reviews Received
              </Typography>
              <Typography variant="h6">
                {profile._count.reviewsReceived}
              </Typography>
            </Box>
          </Stack>
        </Stack>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PublicProfile;

