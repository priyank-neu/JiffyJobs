import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  ImageList,
  ImageListItem,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { taskAPI } from '@/services/api.service';
import { Task, TaskStatus } from '@/types/task.types';
import { useAuth } from '@/contexts/AuthContext';

const statusColors: Record<TaskStatus, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  [TaskStatus.OPEN]: 'primary',
  [TaskStatus.IN_BIDDING]: 'warning',
  [TaskStatus.ASSIGNED]: 'warning',
  [TaskStatus.IN_PROGRESS]: 'warning',
  [TaskStatus.AWAITING_CONFIRMATION]: 'warning',
  [TaskStatus.DISPUTED]: 'error',
  [TaskStatus.COMPLETED]: 'success',
  [TaskStatus.CANCELLED]: 'default',
};

const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    if (!taskId) return;

    try {
      const response = await taskAPI.getTaskById(taskId);
      setTask(response.task);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch task');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTask = async () => {
    if (!taskId || !window.confirm('Are you sure you want to cancel this task?')) return;

    try {
      await taskAPI.cancelTask(taskId);
      fetchTask();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel task');
    }
  };

  const handleDeleteTask = async () => {
    if (!taskId || !window.confirm('Are you sure you want to delete this task? This cannot be undone.')) return;

    try {
      await taskAPI.deleteTask(taskId);
      navigate('/my-tasks');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete task');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !task) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Task not found'}</Alert>
        <Button 
          sx={{ mt: 2 }} 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/my-tasks')}
        >
          Back to My Tasks
        </Button>
      </Container>
    );
  }

  const isOwner = user?.userId === task.posterId;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/my-tasks')}
        sx={{ mb: 2 }}
      >
        Back to My Tasks
      </Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3, gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              {task.title}
            </Typography>
            <Chip label={task.status} color={statusColors[task.status]} />
          </Box>
          {isOwner && task.status === TaskStatus.OPEN && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/tasks/${taskId}/edit`)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteTask}
              >
                Delete
              </Button>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {task.description}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Category
            </Typography>
            <Chip label={task.category.replace('_', ' ')} variant="outlined" />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Budget
            </Typography>
            <Typography variant="h5" color="primary" fontWeight="bold">
              ${task.budget}
            </Typography>
            {(task.budgetMin || task.budgetMax) && (
              <Typography variant="body2" color="text.secondary">
                Range: ${task.budgetMin || task.budget} - ${task.budgetMax || task.budget}
              </Typography>
            )}
          </Box>

          {task.estimatedHours && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Estimated Duration
              </Typography>
              <Typography variant="body1">{task.estimatedHours} hours</Typography>
            </Box>
          )}

          {task.taskDate && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Scheduled For
              </Typography>
              <Typography variant="body1">
                {new Date(task.taskDate).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Typography>
            </Box>
          )}

          {task.addressMasked && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Location
              </Typography>
              <Typography variant="body1">{task.addressMasked}</Typography>
            </Box>
          )}

          {task.photos && task.photos.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Photos ({task.photos.length})
              </Typography>
              <ImageList cols={3} gap={8} sx={{ mt: 1 }}>
                {task.photos.map((photo) => (
                  <ImageListItem key={photo.photoId}>
                    <img
                      src={photo.photoUrl}
                      alt="Task photo"
                      loading="lazy"
                      style={{ 
                        height: 200, 
                        objectFit: 'cover', 
                        borderRadius: 8,
                        cursor: 'pointer',
                        border: '1px solid #e0e0e0',
                      }}
                      onClick={() => window.open(photo.photoUrl, '_blank')}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Click on any photo to view full size
              </Typography>
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Posted By
            </Typography>
            <Typography variant="body1">{task.poster?.name || task.poster?.email}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Posted On
            </Typography>
            <Typography variant="body1">
              {new Date(task.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Typography>
          </Box>

          {task.updatedAt !== task.createdAt && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="body1">
                {new Date(task.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Typography>
            </Box>
          )}
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            fullWidth 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/my-tasks')}
          >
            Back to My Tasks
          </Button>
          {isOwner && task.status === TaskStatus.OPEN && (
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={handleCancelTask}
            >
              Cancel Task
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default TaskDetail;