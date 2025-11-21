// src/components/reviews/ReviewList.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FlagIcon from '@mui/icons-material/Flag';
import { Review, ReviewTag, REVIEW_TAG_LABELS } from '@/types/review.types';
import { reviewAPI } from '@/services/api.service';
import { useAuth } from '@/contexts/AuthContext';

interface ReviewListProps {
  userId: string;
  showActions?: boolean; // Show edit/delete/report actions
}

const ReviewList: React.FC<ReviewListProps> = ({ userId, showActions = false }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reviewAPI.getUserReviews(userId, page, 10);
      setReviews(response.reviews);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [userId, page]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, review: Review) => {
    setAnchorEl(event.currentTarget);
    setSelectedReview(review);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReview(null);
  };

  const handleReport = async () => {
    if (!selectedReview) return;

    try {
      await reviewAPI.reportReview(selectedReview.reviewId);
      alert('Review reported successfully. Thank you for helping keep our community safe.');
      handleMenuClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to report review');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (reviews.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No reviews yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {reviews.map((review) => (
        <Card key={review.reviewId} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box>
                <Typography variant="h6" component="div">
                  {review.reviewer.name || review.reviewer.email}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(review.createdAt).toLocaleDateString()}
                  {review.isEdited && (
                    <span style={{ marginLeft: 8, fontStyle: 'italic' }}>(Edited)</span>
                  )}
                </Typography>
              </Box>
              {showActions && (
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, review)}
                  aria-label="more options"
                >
                  <MoreVertIcon />
                </IconButton>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Rating value={review.rating} readOnly size="small" />
              <Typography variant="body2" color="text.secondary">
                {review.rating}/5
              </Typography>
            </Box>

            {review.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {review.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={REVIEW_TAG_LABELS[tag]}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}

            {review.comment && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {review.comment}
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Task: {review.contract.task.title}
            </Typography>
          </CardContent>
        </Card>
      ))}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleReport}>
          <FlagIcon sx={{ mr: 1 }} fontSize="small" />
          Report Review
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ReviewList;

