import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import MyBidsComponent from '../components/tasks/MyBids';

const MyBids: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          My Bids
        </Typography>
      </Box>
      <MyBidsComponent />
    </Container>
  );
};

export default MyBids;
