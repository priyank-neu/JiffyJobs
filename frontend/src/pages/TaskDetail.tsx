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
  Card,
  CardContent
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { taskAPI } from '@/services/api.service';
import { Task, TaskStatus } from '@/types/task.types';
import { useAuth } from '@/contexts/AuthContext';
import { TaskDetailCard, TaskDetails, TaskDescription, TaskLocation, TaskPoster } from '../components/tasks/TaskDetailCard';

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

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* Main Content */}
          <Box sx={{ flex: { xs: '1', md: '2' } }}>
            <Stack spacing={3}>
              {/* Task Description */}
              <TaskDescription task={task} />

              {/* Task Details (no skill match for owner view) */}
              <TaskDetails task={task} showSkillMatch={false} />

              {/* Location Information */}
              <TaskLocation task={task} />

              {/* Task Photos */}
              {task.photos && task.photos.length > 0 && (
                <TaskDetailCard title={`Photos (${task.photos.length})`} icon={<EditIcon />}>
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
                </TaskDetailCard>
              )}
            </Stack>
          </Box>

          {/* Sidebar */}
          <Box sx={{ flex: { xs: '1', md: '1' }, minWidth: '300px' }}>
            <Stack spacing={3}>
              {/* Poster Information */}
              <TaskPoster task={task} />

              {/* Task Management Actions */}
              {isOwner && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Task Management
                    </Typography>
                    <Stack spacing={2}>
                      {task.status === TaskStatus.OPEN && (
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => navigate(`/tasks/${taskId}/edit`)}
                          fullWidth
                        >
                          Edit Task
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDeleteTask}
                        fullWidth
                      >
                        Delete Task
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Task Status Info */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Task Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip label={task.status} color={statusColors[task.status]} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {task.status === 'OPEN' && 'This task is available for helpers to apply.'}
                    {task.status === 'IN_PROGRESS' && 'This task is currently being worked on.'}
                    {task.status === 'COMPLETED' && 'This task has been completed.'}
                    {task.status === 'CANCELLED' && 'This task has been cancelled.'}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/my-tasks')}
          >
            Back to My Tasks
          </Button>
          {isOwner && task.status === TaskStatus.OPEN && (
            <Button
              variant="outlined"
              color="error"
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