import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Avatar,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  PhotoCamera,
  Save,
  Delete,
} from '@mui/icons-material';
import { profileAPI, uploadAPI } from '@/services/api.service';
import { UserProfile, UpdateProfileData } from '@/types/profile.types';

const ProfileEdit: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [preferredHourlyRate, setPreferredHourlyRate] = useState<string>('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await profileAPI.getMyProfile();
      const profileData = response.profile;
      setName(profileData.name || '');
      setBio(profileData.bio || '');
      setAvatarUrl(profileData.avatarUrl);
      setPreferredHourlyRate(
        profileData.preferredHourlyRate ? profileData.preferredHourlyRate.toString() : ''
      );
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));

    try {
      // Get presigned URL
      const uploadResponse = await uploadAPI.getPresignedUrl({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      if (uploadResponse.isBase64Upload) {
        // Convert to base64 for development
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setAvatarUrl(base64String);
        };
        reader.readAsDataURL(file);
      } else {
        // In production, upload to S3 using presigned URL
        // For now, use base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setAvatarUrl(base64String);
        };
        reader.readAsDataURL(file);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to prepare avatar upload');
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const updateData: UpdateProfileData = {
        name: name.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
        preferredHourlyRate: preferredHourlyRate
          ? parseFloat(preferredHourlyRate)
          : undefined,
      };

      await profileAPI.updateProfile(updateData);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        fetchProfile();
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Edit Profile
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Profile updated successfully!
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Avatar Upload */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Profile Photo
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={avatarPreview || avatarUrl || undefined}
                  sx={{ width: 100, height: 100 }}
                >
                  {name?.[0]?.toUpperCase() || 'U'}
                </Avatar>
                <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<PhotoCamera />}
                    size="small"
                  >
                    Upload Photo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </Button>
                  {(avatarPreview || avatarUrl) && (
                    <Button
                      variant="text"
                      color="error"
                      size="small"
                      startIcon={<Delete />}
                      onClick={handleRemoveAvatar}
                    >
                      Remove
                    </Button>
                  )}
                </Stack>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                JPEG, PNG, or WebP. Max 5MB.
              </Typography>
            </Box>

            {/* Name */}
            <TextField
              label="Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />

            {/* Bio */}
            <TextField
              label="Bio"
              multiline
              rows={4}
              fullWidth
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              helperText={`${bio.length}/500 characters`}
              inputProps={{ maxLength: 500 }}
            />

            {/* Preferred Hourly Rate */}
            <TextField
              label="Preferred Hourly Rate (Optional)"
              type="number"
              fullWidth
              value={preferredHourlyRate}
              onChange={(e) => setPreferredHourlyRate(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText="Your preferred hourly rate for tasks (optional)"
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<Save />}
              disabled={saving}
              fullWidth
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileEdit;

