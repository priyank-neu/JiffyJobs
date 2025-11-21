import React from 'react';
import { Container, Box } from '@mui/material';
import CreateTaskForm from '@/components/tasks/CreateTaskForm';

const CreateTask: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <CreateTaskForm />
      </Container>
    </Box>
  );
};

export default CreateTask;