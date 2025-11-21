import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import { ReportType } from '@/types/report.types';
import { reportAPI } from '@/services/api.service';

interface ReportFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: ReportType;
  targetId: string;
  targetTitle?: string;
}

const ReportForm: React.FC<ReportFormProps> = ({
  open,
  onClose,
  onSuccess,
  type,
  targetId,
  targetTitle,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!reason.trim()) {
        setError('Please provide a reason for the report');
        setLoading(false);
        return;
      }

      await reportAPI.createReport({
        type,
        targetId,
        reason: reason.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setReason('');
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case ReportType.TASK:
        return 'Task';
      case ReportType.USER:
        return 'User';
      case ReportType.MESSAGE:
        return 'Message';
      case ReportType.REVIEW:
        return 'Review';
      default:
        return 'Item';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Report {getTypeLabel()}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {targetTitle && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Reporting:
              </Typography>
              <Chip label={targetTitle} size="small" />
            </Box>
          )}

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success">
              Report submitted successfully. Our team will review it shortly.
            </Alert>
          )}

          <TextField
            label="Reason for Report"
            multiline
            rows={4}
            fullWidth
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please describe why you are reporting this item..."
            helperText="Provide as much detail as possible to help us review your report"
            disabled={loading || success}
          />

          <Typography variant="body2" color="text.secondary">
            Your report will be reviewed by our moderation team. You will be notified of the outcome.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading || success}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || success || !reason.trim()}
        >
          {loading ? 'Submitting...' : 'Submit Report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportForm;

