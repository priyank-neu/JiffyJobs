import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Stack,
  Autocomplete,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Add,
  Delete,
} from '@mui/icons-material';
import { profileAPI } from '@/services/api.service';
import { UserProfile } from '@/types/profile.types';

interface Skill {
  skillId: string;
  name: string;
  category: string;
  description: string | null;
}

const SkillsManager: React.FC<{ profile: UserProfile | null; onUpdate: () => void }> = ({
  profile,
  onUpdate,
}) => {
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [skillLevel, setSkillLevel] = useState<string>('BEGINNER');
  const [experienceYears, setExperienceYears] = useState<string>('0');

  useEffect(() => {
    fetchAvailableSkills();
  }, []);

  const fetchAvailableSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await profileAPI.getAllSkills();
      setAvailableSkills(response.skills);
    } catch (err: any) {
      console.error('Error fetching skills:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load skills';
      setError(errorMessage);
      
      // If it's an authentication error, redirect to login
      if (err.response?.status === 401 || err.response?.status === 403) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!selectedSkill) {
      setError('Please select a skill');
      return;
    }

    try {
      setError(null);
      await profileAPI.addSkill({
        skillId: selectedSkill.skillId,
        level: skillLevel,
        experienceYears: parseInt(experienceYears) || 0,
      });
      setSuccess(true);
      setSelectedSkill(null);
      setSkillLevel('BEGINNER');
      setExperienceYears('0');
      setTimeout(() => {
        setSuccess(false);
        onUpdate();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add skill');
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      setError(null);
      await profileAPI.removeSkill(skillId);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onUpdate();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove skill');
    }
  };

  // Get skills that user doesn't already have
  const userSkillIds = profile?.userSkills?.map((us) => us.skillId) || [];
  const availableToAdd = availableSkills.filter(
    (skill) => !userSkillIds.includes(skill.skillId)
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ADVANCED':
        return 'error';
      case 'INTERMEDIATE':
        return 'warning';
      case 'BEGINNER':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading && availableSkills.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Skills & Expertise
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Skills updated successfully!
          </Alert>
        )}

        {/* Add Skill Form */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Add a Skill
          </Typography>
          <Stack spacing={2}>
            <Autocomplete
              options={availableToAdd}
              getOptionLabel={(option) => option.name}
              value={selectedSkill}
              onChange={(_, newValue) => setSelectedSkill(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Select Skill" placeholder="Search skills..." />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.category}
                    </Typography>
                  </Box>
                </Box>
              )}
            />

            {selectedSkill && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Skill Level</InputLabel>
                  <Select
                    value={skillLevel}
                    label="Skill Level"
                    onChange={(e) => setSkillLevel(e.target.value)}
                  >
                    <MenuItem value="BEGINNER">Beginner</MenuItem>
                    <MenuItem value="INTERMEDIATE">Intermediate</MenuItem>
                    <MenuItem value="ADVANCED">Advanced</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Years of Experience"
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  inputProps={{ min: 0, max: 50 }}
                />

                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddSkill}
                  fullWidth
                >
                  Add Skill
                </Button>
              </>
            )}
          </Stack>
        </Box>

        {/* User's Skills List */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Your Skills ({profile?.userSkills?.length || 0})
          </Typography>
          {profile?.userSkills && profile.userSkills.length > 0 ? (
            <Stack spacing={1} sx={{ mt: 2 }}>
              {profile.userSkills.map((userSkill) => (
                <Box
                  key={userSkill.userSkillId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {userSkill.skill.name}
                    </Typography>
                    <Chip
                      label={userSkill.level}
                      size="small"
                      color={getLevelColor(userSkill.level)}
                    />
                    {userSkill.experienceYears !== null && userSkill.experienceYears > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {userSkill.experienceYears} years
                      </Typography>
                    )}
                  </Stack>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveSkill(userSkill.skillId)}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No skills added yet. Add your first skill above!
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SkillsManager;

