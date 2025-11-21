import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  Refresh,
} from '@mui/icons-material';
import { reportAPI } from '@/services/api.service';
import { Report, ReportType, ReportStatus } from '@/types/report.types';

interface AdminReportsQueueProps {
  onAction?: () => void;
}

const AdminReportsQueue: React.FC<AdminReportsQueueProps> = ({ onAction }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReports();
  }, [typeFilter, statusFilter, page]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportAPI.getReports({
        page,
        limit: 20,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setReports(response.reports);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
    setDetailDialogOpen(true);
  };

  const handleResolve = async (status: ReportStatus) => {
    if (!selectedReport) return;

    try {
      setResolving(true);
      await reportAPI.resolveReport(selectedReport.type, selectedReport.reportId, status, resolutionNotes);
      setResolveDialogOpen(false);
      setResolutionNotes('');
      setSelectedReport(null);
      fetchReports();
      if (onAction) onAction();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resolve report');
    } finally {
      setResolving(false);
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.OPEN:
        return 'error';
      case ReportStatus.RESOLVED:
        return 'success';
      case ReportStatus.CLOSED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: ReportType) => {
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && reports.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">Reports Queue</Typography>
            <Button startIcon={<Refresh />} onClick={fetchReports} disabled={loading}>
              Refresh
            </Button>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Filters */}
          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="TASK">Task</MenuItem>
                <MenuItem value="USER">User</MenuItem>
                <MenuItem value="MESSAGE">Message</MenuItem>
                <MenuItem value="REVIEW">Review</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="OPEN">Open</MenuItem>
                <MenuItem value="RESOLVED">Resolved</MenuItem>
                <MenuItem value="CLOSED">Closed</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Reports Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Reporter</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No reports found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.reportId}>
                      <TableCell>
                        <Chip label={getTypeLabel(report.type)} size="small" />
                      </TableCell>
                      <TableCell>
                        {report.task?.title ||
                          report.reportedUser?.name ||
                          report.message?.body?.substring(0, 30) ||
                          `Review #${report.review?.reviewId?.substring(0, 8)}` ||
                          'N/A'}
                      </TableCell>
                      <TableCell>{report.reporter.name || report.reporter.email}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {report.reason}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={report.status}
                          color={getStatusColor(report.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(report.createdAt)}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(report)}
                            color="primary"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </Stack>
      </CardContent>

      {/* Report Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedReport(null);
        }}
        maxWidth="md"
        fullWidth
      >
        {selectedReport && (
          <>
            <DialogTitle>
              Report Details - {getTypeLabel(selectedReport.type)}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedReport.status}
                    color={getStatusColor(selectedReport.status) as any}
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Reporter
                  </Typography>
                  <Typography variant="body1">
                    {selectedReport.reporter.name || selectedReport.reporter.email}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Reason
                  </Typography>
                  <Typography variant="body1">{selectedReport.reason}</Typography>
                </Box>

                {selectedReport.evidence && selectedReport.evidence.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Evidence
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      {selectedReport.evidence.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Evidence ${idx + 1}`}
                          style={{ maxWidth: 100, maxHeight: 100, objectFit: 'cover' }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {selectedReport.resolutionNotes && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Resolution Notes
                    </Typography>
                    <Typography variant="body1">{selectedReport.resolutionNotes}</Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">{formatDate(selectedReport.createdAt)}</Typography>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setDetailDialogOpen(false);
                  setSelectedReport(null);
                }}
              >
                Close
              </Button>
              {selectedReport.status === ReportStatus.OPEN && (
                <Button
                  variant="contained"
                  onClick={() => {
                    setDetailDialogOpen(false);
                    setResolveDialogOpen(true);
                  }}
                >
                  Resolve
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Report</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Resolution Status</InputLabel>
              <Select
                value=""
                label="Resolution Status"
                onChange={(e) => {
                  if (selectedReport) {
                    handleResolve(e.target.value as ReportStatus);
                  }
                }}
              >
                <MenuItem value={ReportStatus.RESOLVED}>Resolved</MenuItem>
                <MenuItem value={ReportStatus.CLOSED}>Closed</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Resolution Notes (Optional)"
              multiline
              rows={3}
              fullWidth
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Add any notes about how this report was resolved..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)} disabled={resolving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleResolve(ReportStatus.RESOLVED)}
            disabled={resolving}
          >
            {resolving ? 'Resolving...' : 'Resolve'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default AdminReportsQueue;

