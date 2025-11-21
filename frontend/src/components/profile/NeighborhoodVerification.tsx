import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  LocationOn,
  Verified,
  GpsFixed,
  Lock,
} from '@mui/icons-material';
import { profileAPI } from '@/services/api.service';
import { UserProfile } from '@/types/profile.types';

interface NeighborhoodVerificationProps {
  profile: UserProfile | null;
  onUpdate: () => void;
}

const NeighborhoodVerification: React.FC<NeighborhoodVerificationProps> = ({
  profile,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Neighborhood setting
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Verification
  const [verificationMethod, setVerificationMethod] = useState<'geo' | 'otp' | null>(null);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [otpFromResponse, setOtpFromResponse] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.neighborhoodLocation) {
      setAddress(profile.neighborhoodLocation.address);
      setCity(profile.neighborhoodLocation.city || '');
      setState(profile.neighborhoodLocation.state || '');
      setZipCode(profile.neighborhoodLocation.zipCode || '');
      setLatitude(Number(profile.neighborhoodLocation.latitude));
      setLongitude(Number(profile.neighborhoodLocation.longitude));
    }
  }, [profile]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLoading(false);
        // Reverse geocode to get address (simplified - in production use a geocoding service)
        setAddress(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
      },
      (err) => {
        setError('Failed to get your location. Please enter it manually.');
        setLoading(false);
      }
    );
  };

  const handleSetNeighborhood = async () => {
    if (!address || !latitude || !longitude) {
      setError('Please provide an address and location coordinates');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await profileAPI.setNeighborhood({
        latitude,
        longitude,
        address,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onUpdate();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set neighborhood');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyByGeo = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await profileAPI.verifyNeighborhoodByGeo(
            position.coords.latitude,
            position.coords.longitude
          );
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            onUpdate();
          }, 2000);
        } catch (err: any) {
          setError(err.response?.data?.error || 'Failed to verify location');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Failed to get your current location');
        setLoading(false);
      }
    );
  };

  const handleGenerateOTP = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await profileAPI.generateNeighborhoodOTP();
      setOtpToken(result.token);
      setOtpFromResponse(result.otp || null); // For testing only
      setOtpDialogOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpToken || !otp) {
      setError('Please enter the OTP');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await profileAPI.verifyNeighborhoodByOTP(otpToken, otp);
      setSuccess(true);
      setOtpDialogOpen(false);
      setOtp('');
      setOtpToken(null);
      setTimeout(() => {
        setSuccess(false);
        onUpdate();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const hasNeighborhood = profile?.neighborhoodLocationId !== null;
  const isVerified = profile?.neighborhoodVerified || false;

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <LocationOn color="primary" />
          <Typography variant="h6">Neighborhood Verification</Typography>
          {isVerified && (
            <Chip
              icon={<Verified />}
              label="Verified"
              color="success"
              size="small"
            />
          )}
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {isVerified ? 'Neighborhood verified successfully!' : 'Neighborhood updated successfully!'}
          </Alert>
        )}

        {/* Set Neighborhood */}
        {!hasNeighborhood && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Set Your Neighborhood
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<GpsFixed />}
                onClick={handleGetCurrentLocation}
                disabled={loading}
                fullWidth
              >
                Use Current Location
              </Button>

              <TextField
                label="Address"
                fullWidth
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address"
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  label="City"
                  fullWidth
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <TextField
                  label="State"
                  fullWidth
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
                <TextField
                  label="ZIP Code"
                  fullWidth
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </Stack>

              {(latitude && longitude) && (
                <Typography variant="caption" color="text.secondary">
                  Location: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </Typography>
              )}

              <Button
                variant="contained"
                onClick={handleSetNeighborhood}
                disabled={loading || !address || !latitude || !longitude}
                fullWidth
              >
                {loading ? 'Saving...' : 'Save Neighborhood'}
              </Button>
            </Stack>
          </Box>
        )}

        {/* Verify Neighborhood */}
        {hasNeighborhood && !isVerified && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Verify Your Neighborhood
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Verify your neighborhood location to earn a verification badge. You can verify using
              geolocation or OTP.
            </Typography>

            <Stack spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<GpsFixed />}
                onClick={handleVerifyByGeo}
                disabled={loading}
                fullWidth
              >
                Verify with Current Location
              </Button>

              <Button
                variant="outlined"
                startIcon={<Lock />}
                onClick={handleGenerateOTP}
                disabled={loading}
                fullWidth
              >
                Verify with OTP
              </Button>
            </Stack>
          </Box>
        )}

        {/* Verified Status */}
        {isVerified && (
          <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Verified color="success" />
              <Typography variant="body2">
                Your neighborhood is verified! This badge appears on your public profile.
              </Typography>
            </Stack>
            {profile?.neighborhoodVerifiedAt && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Verified on {new Date(profile.neighborhoodVerifiedAt).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        )}

        {/* Current Neighborhood Info */}
        {hasNeighborhood && profile?.neighborhoodLocation && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Current Neighborhood
            </Typography>
            <Typography variant="body2">
              {profile.neighborhoodLocation.address}
            </Typography>
            {(profile.neighborhoodLocation.city || profile.neighborhoodLocation.state) && (
              <Typography variant="body2" color="text.secondary">
                {[profile.neighborhoodLocation.city, profile.neighborhoodLocation.state]
                  .filter(Boolean)
                  .join(', ')}
              </Typography>
            )}
          </Box>
        )}

        {/* OTP Dialog */}
        <Dialog open={otpDialogOpen} onClose={() => setOtpDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Enter Verification Code</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Enter the verification code sent to your email.
              </Typography>
              {otpFromResponse && (
                <Alert severity="info">
                  <Typography variant="caption">
                    For testing: Your OTP is <strong>{otpFromResponse}</strong>
                  </Typography>
                </Alert>
              )}
              <TextField
                label="Verification Code"
                fullWidth
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                inputProps={{ maxLength: 6 }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOtpDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleVerifyOTP}
              disabled={loading || !otp}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default NeighborhoodVerification;

