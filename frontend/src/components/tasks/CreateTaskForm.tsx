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
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title || !formData.description || !formData.budget) {
      setError('Please fill in all required fields');
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
      });

      navigate('/my-tasks');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create task');
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