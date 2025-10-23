import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Stack,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { taskAPI } from '@/services/api.service';
import { TaskCategory, Task } from '@/types/task.types';

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

const EditTask: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    if (!taskId) return;
    
    try {
      const response = await taskAPI.getTaskById(taskId);
      const taskData = response.task;
      setTask(taskData);
      setFormData({
        title: taskData.title,
        description: taskData.description,
        category: taskData.category,
        budget: taskData.budget.toString(),
        budgetMin: taskData.budgetMin?.toString() || '',
        budgetMax: taskData.budgetMax?.toString() || '',
        estimatedHours: taskData.estimatedHours?.toString() || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch task');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!taskId) return;

    // Validation
    const budget = parseFloat(formData.budget);
    const budgetMin = formData.budgetMin ? parseFloat(formData.budgetMin) : undefined;
    const budgetMax = formData.budgetMax ? parseFloat(formData.budgetMax) : undefined;

    if (budgetMin && budgetMax && budgetMin > budgetMax) {
      setError('Minimum budget cannot be greater than maximum budget');
      return;
    }

    setSubmitting(true);

    try {
      await taskAPI.updateTask(taskId, {
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
      setError(err.response?.data?.error || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!task) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Task not found</Alert>
      </Container>
    );
  }

  if (task.status !== 'OPEN') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          You can only edit tasks with OPEN status. This task is {task.status}.
        </Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/my-tasks')}>
          Back to My Tasks
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px)', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Edit Task
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Update your task details below
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
              />

              <Input
                label="Description *"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                multiline
                rows={4}
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
              />

              <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                <Button
                  type="button"
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/my-tasks')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  loading={submitting}
                >
                  Update Task
                </Button>
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default EditTask;