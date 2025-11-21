import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { taskAPI } from '@/services/api.service';
import { Task, TaskStatus } from '@/types/task.types';
 
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
 
const MyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
 
  useEffect(() => {
    fetchTasks();
  }, []);
 
  const fetchTasks = async () => {
    try {
      const response = await taskAPI.getMyTasks();
      setTasks(response.tasks);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } } };
      setError(apiError.response?.data?.error || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };
 
  const handleCancelTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to cancel this task?')) return;
 
    try {
      await taskAPI.cancelTask(taskId);
      fetchTasks();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } } };
      alert(apiError.response?.data?.error || 'Failed to cancel task');
    }
  };
 
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
 
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          My Tasks
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/tasks/create')}
        >
          Post New Task
        </Button>
      </Box>
 
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
 
      {tasks.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tasks yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first task to get started!
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/tasks/create')}
          >
            Post Your First Task
          </Button>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {tasks.map((task) => (
            <Paper key={task.taskId} sx={{ p: 3, '&:hover': { boxShadow: 4 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h6" fontWeight="bold">
                      {task.title}
                    </Typography>
                    <Chip
                      label={task.status}
                      color={statusColors[task.status]}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {task.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={task.category.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`$${task.budget}`}
                      size="small"
                      color="primary"
                    />
                    {task.budgetMin && task.budgetMax && (
                      <Chip
                        label={`Range: $${task.budgetMin}-$${task.budgetMax}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {task.estimatedHours && (
                      <Chip
                        label={`${task.estimatedHours}h`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {task.location && (
                      <Chip
                        label={`${task.location.city}, ${task.location.state}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {!task.location && task.addressMasked && (
                      <Chip
                        label={task.addressMasked}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {task.photos && task.photos.length > 0 && (
                      <Chip
                        label={`${task.photos.length} photo${task.photos.length > 1 ? 's' : ''}`}
                        size="small"
                        variant="outlined"
                        color="secondary"
                      />
                    )}
                    {task.taskDate && (
                      <Chip
                        label={new Date(task.taskDate).toLocaleDateString()}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                  {task.status === TaskStatus.OPEN && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/tasks/${task.taskId}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleCancelTask(task.taskId)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => navigate(`/task/${task.taskId}`)}
                  >
                    View
                  </Button>
                </Box>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}
    </Container>
  );
};
 
export default MyTasks;