import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  MenuItem,
  Alert,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import PhotoUpload from './PhotoUpload';
import { taskAPI } from '@/services/api.service';
import { TaskCategory } from '@/types/task.types';

const categories = [
  { value: TaskCategory.HOME_REPAIR, label: 'Home Repair' },
  { value: TaskCategory.CLEANING, label: 'Cleaning' },
  { value: TaskCategory.MOVING, label: 'Moving' },
  { value: TaskCategory.DELIVERY, label: 'Delivery' },
  { value: TaskCategory.ASSEMBLY, label: 'Assembly' },
  { value: TaskCategory.YARD_WORK, label: 'Yard Work' },
  { value: TaskCategory.PET_CARE, label: 'Pet Care' },
  { value: TaskCategory.TECH_SUPPORT, label: 'Tech Support' },
  { value: TaskCategory.TUTORING, label: 'Tutoring' },
  { value: TaskCategory.OTHER, label: 'Other' },
];

const CreateTaskForm: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: TaskCategory.OTHER,
    budget: '',
    budgetMin: '',
    budgetMax: '',
    estimatedHours: '',
  });
  const [taskDate, setTaskDate] = useState<Dayjs | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: 0,
    longitude: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation({
      ...location,
      [e.target.name]: e.target.value,
    });
    setLocationError('');
  };

  const geocodeAddress = async () => {
    if (!location.address || !location.city || !location.state) {
      setLocationError('Please fill in address, city, and state');
      return;
    }

    const fullAddress = `${location.address}, ${location.city}, ${location.state} ${location.zipCode}`;
    
    try {
      // Using a free geocoding service (you might want to use Google Maps API in production)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        setLocation(prev => ({
          ...prev,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        }));
        setLocationError('');
      } else {
        setLocationError('Could not find coordinates for this address');
      }
    } catch {
      setLocationError('Failed to get location coordinates');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title || !formData.description || !formData.budget) {
      setError('Please fill in all required fields');
      return;
    }

    if (!location.address || !location.city || !location.state) {
      setError('Please fill in location details');
      return;
    }

    if (location.latitude === 0 && location.longitude === 0) {
      setError('Please get location coordinates by clicking "Get Location"');
      return;
    }

    const budget = parseFloat(formData.budget);
    const budgetMin = formData.budgetMin ? parseFloat(formData.budgetMin) : undefined;
    const budgetMax = formData.budgetMax ? parseFloat(formData.budgetMax) : undefined;

    if (budgetMin && budgetMax && budgetMin > budgetMax) {
      setError('Minimum budget cannot be greater than maximum budget');
      return;
    }

    setLoading(true);

    try {
      await taskAPI.createTask({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget,
        budgetMin,
        budgetMax,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
        taskDate: taskDate ? taskDate.toDate() : undefined,
        photos: photos.length > 0 ? photos : undefined,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          city: location.city,
          state: location.state,
          zipCode: location.zipCode,
        },
      });

      navigate('/my-tasks');
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } } };
      setError(apiError.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Post a New Task
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Fill in the details below to post your task
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Input
            label="Task Title *"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g., Help moving furniture"
          />

          <Input
            label="Description *"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            multiline
            rows={4}
            placeholder="Provide detailed information about the task..."
          />

          <Input
            label="Category *"
            name="category"
            value={formData.category}
            onChange={handleChange}
            select
            required
          >
            {categories.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Input>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Budget
            </Typography>
            <Stack direction="row" spacing={2}>
              <Input
                label="Budget ($) *"
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
              <Input
                label="Min Budget ($)"
                name="budgetMin"
                type="number"
                value={formData.budgetMin}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.01 }}
              />
              <Input
                label="Max Budget ($)"
                name="budgetMax"
                type="number"
                value={formData.budgetMax}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Stack>
          </Box>

          <Input
            label="Estimated Hours"
            name="estimatedHours"
            type="number"
            value={formData.estimatedHours}
            onChange={handleChange}
            inputProps={{ min: 1, max: 24 }}
            helperText="How long do you think this task will take?"
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label="Task Date & Time"
              value={taskDate}
              onChange={(newValue) => setTaskDate(newValue)}
              minDateTime={dayjs()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: 'When do you need this task completed?'
                }
              }}
            />
          </LocalizationProvider>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Task Location *
            </Typography>
            <Stack spacing={2}>
              <Input
                id="location-address"
                label="Street Address *"
                name="address"
                value={location.address}
                onChange={handleLocationChange}
                required
                placeholder="123 Main Street"
              />
              <Stack direction="row" spacing={2}>
                <Input
                  id="location-city"
                  label="City *"
                  name="city"
                  value={location.city}
                  onChange={handleLocationChange}
                  required
                  placeholder="Boston"
                />
                <Input
                  id="location-state"
                  label="State *"
                  name="state"
                  value={location.state}
                  onChange={handleLocationChange}
                  required
                  placeholder="MA"
                />
                <Input
                  id="location-zipcode"
                  label="ZIP Code"
                  name="zipCode"
                  value={location.zipCode}
                  onChange={handleLocationChange}
                  placeholder="02101"
                />
              </Stack>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={geocodeAddress}
                  disabled={!location.address || !location.city || !location.state}
                >
                  Get Location
                </Button>
                {location.latitude !== 0 && location.longitude !== 0 && (
                  <Typography variant="body2" color="success.main">
                    ✓ Location found: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </Typography>
                )}
              </Box>
              {locationError && (
                <Alert severity="error">
                  {locationError}
                </Alert>
              )}
            </Stack>
          </Box>

          <PhotoUpload
            photos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={5}
          />

          <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
            <Button
              type="button"
              variant="outlined"
              fullWidth
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              loading={loading}
            >
              Post Task
            </Button>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
};

export default CreateTaskForm;