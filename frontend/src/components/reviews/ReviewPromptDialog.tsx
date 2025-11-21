// src/components/reviews/ReviewPromptDialog.tsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import ReviewForm from './ReviewForm';
import { reviewAPI } from '@/services/api.service';
import { Notification } from '@/types/notification.types';

interface ReviewPromptDialogProps {
  open: boolean;
  notification: Notification | null;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

const ReviewPromptDialog: React.FC<ReviewPromptDialogProps> = ({
  open,
  notification,
  onClose,
  onReviewSubmitted,
}) => {
  const [canReview, setCanReview] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingReview, setExistingReview] = useState<any>(null);

  useEffect(() => {
    if (open && notification?.metadata?.contractId) {
      checkReviewStatus();
    }
  }, [open, notification]);

  const checkReviewStatus = async () => {
    if (!notification?.metadata?.contractId) return;

    setLoading(true);
    setError(null);

    try {
      // Check if user can review
      const canReviewResponse = await reviewAPI.canUserReviewContract(
        notification.metadata.contractId as string
      );
      setCanReview(canReviewResponse.canReview);

      if (!canReviewResponse.canReview) {
        // Check if review already exists
        try {
          const review = await reviewAPI.getContractReview(
            notification.metadata.contractId as string
          );
          if (review) {
            setExistingReview(review);
          }
        } catch {
          // No existing review
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to check review status');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    onReviewSubmitted();
    onClose();
  };

  if (!notification || !notification.metadata) {
    return null;
  }

  const contractId = notification.metadata.contractId as string;
  const revieweeId = notification.metadata.revieweeId as string;
  const taskTitle = notification.metadata.taskTitle as string;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Leave a Review</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !canReview && !existingReview ? (
          <Alert severity="info">
            {notification.metadata.reason || 'You cannot review this contract at this time.'}
          </Alert>
        ) : (
          <ReviewForm
            contractId={contractId}
            revieweeId={revieweeId}
            taskTitle={taskTitle}
            existingReview={existingReview}
            onSuccess={handleReviewSubmitted}
            onCancel={onClose}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewPromptDialog;

