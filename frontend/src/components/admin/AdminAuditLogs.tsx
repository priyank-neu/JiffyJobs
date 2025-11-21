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
  Stack,
  Pagination,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { moderationAPI } from '@/services/api.service';
import { AuditLog } from '@/types/report.types';

const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, [page, entityTypeFilter, actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await moderationAPI.getAuditLogs({
        page,
        limit: 50,
        entityType: entityTypeFilter !== 'all' ? entityTypeFilter : undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
      });
      setLogs(response.logs);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action: string) => {
    if (action.includes('SUSPEND') || action.includes('LOCK') || action.includes('HIDE')) {
      return 'error';
    }
    if (action.includes('REACTIVATE') || action.includes('UNLOCK') || action.includes('UNHIDE')) {
      return 'success';
    }
    return 'default';
  };

  if (loading && logs.length === 0) {
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
            <Typography variant="h5">Audit Logs</Typography>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Filters */}
          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Entity Type</InputLabel>
              <Select
                value={entityTypeFilter}
                label="Entity Type"
                onChange={(e) => {
                  setEntityTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Task">Task</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
                <MenuItem value="Review">Review</MenuItem>
                <MenuItem value="Report">Report</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Action</InputLabel>
              <Select
                value={actionFilter}
                label="Action"
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="all">All Actions</MenuItem>
                <MenuItem value="SUSPEND_USER">Suspend User</MenuItem>
                <MenuItem value="REACTIVATE_USER">Reactivate User</MenuItem>
                <MenuItem value="HIDE_REVIEW">Hide Review</MenuItem>
                <MenuItem value="UNHIDE_REVIEW">Unhide Review</MenuItem>
                <MenuItem value="LOCK_TASK">Lock Task</MenuItem>
                <MenuItem value="UNLOCK_TASK">Unlock Task</MenuItem>
                <MenuItem value="LOCK_CONTRACT">Lock Contract</MenuItem>
                <MenuItem value="UNLOCK_CONTRACT">Unlock Contract</MenuItem>
                <MenuItem value="TRIGGER_REFUND">Trigger Refund</MenuItem>
                <MenuItem value="RESOLVE_REPORT">Resolve Report</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Audit Logs Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>Entity ID</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No audit logs found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.auditLogId}>
                      <TableCell>{formatDate(log.createdAt)}</TableCell>
                      <TableCell>
                        {log.admin.name || log.admin.email}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action}
                          color={getActionColor(log.action) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.entityType}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {log.entityId.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {log.notes || '-'}
                        </Typography>
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
    </Card>
  );
};

export default AdminAuditLogs;

