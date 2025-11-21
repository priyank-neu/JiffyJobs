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
  InputAdornment,
} from '@mui/material';
import {
  PersonOff,
  PersonAdd,
  Search,
  Refresh,
} from '@mui/icons-material';
import { moderationAPI, adminUserAPI } from '@/services/api.service';

enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

enum UserRole {
  POSTER = 'POSTER',
  HELPER = 'HELPER',
  ADMIN = 'ADMIN',
}

interface User {
  userId: string;
  email: string;
  name: string | null;
  accountStatus: AccountStatus;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  _count: {
    postedTasks: number;
    assignedTasks: number;
    bids: number;
    contracts: number;
  };
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'reactivate' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [performingAction, setPerformingAction] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [statusFilter, roleFilter, page, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('accountStatus', statusFilter);
      if (roleFilter !== 'all') params.append('role', roleFilter);

      const data = await adminUserAPI.getAllUsers({
        page,
        limit: 20,
        search: searchTerm || undefined,
        accountStatus: statusFilter !== 'all' ? statusFilter : undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
      });
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = (user: User) => {
    setSelectedUser(user);
    setActionType('suspend');
    setActionReason('');
    setActionDialogOpen(true);
  };

  const handleReactivate = (user: User) => {
    setSelectedUser(user);
    setActionType('reactivate');
    setActionReason('');
    setActionDialogOpen(true);
  };

  const performAction = async () => {
    if (!selectedUser || !actionType) return;

    try {
      setPerformingAction(true);
      
      if (actionType === 'suspend') {
        await moderationAPI.suspendUser(selectedUser.userId, actionReason || undefined);
      } else {
        await moderationAPI.reactivateUser(selectedUser.userId);
      }

      setActionDialogOpen(false);
      setActionReason('');
      setActionType(null);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to perform action');
    } finally {
      setPerformingAction(false);
    }
  };

  const getStatusColor = (status: AccountStatus) => {
    switch (status) {
      case AccountStatus.ACTIVE:
        return 'success';
      case AccountStatus.SUSPENDED:
        return 'error';
      case AccountStatus.DELETED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'error';
      case UserRole.HELPER:
        return 'primary';
      case UserRole.POSTER:
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading && users.length === 0) {
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
            <Typography variant="h5">User Management</Typography>
            <Button startIcon={<Refresh />} onClick={fetchUsers} disabled={loading}>
              Refresh
            </Button>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Filters */}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />

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
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="SUSPENDED">Suspended</MenuItem>
                <MenuItem value="DELETED">Deleted</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                label="Role"
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="HELPER">Helper</MenuItem>
                <MenuItem value="POSTER">Poster</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Users Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Verified</TableCell>
                  <TableCell>Tasks</TableCell>
                  <TableCell>Bids</TableCell>
                  <TableCell>Contracts</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={getRoleColor(user.role) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.accountStatus}
                          color={getStatusColor(user.accountStatus) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {user.isVerified ? (
                          <Chip label="Yes" color="success" size="small" />
                        ) : (
                          <Chip label="No" size="small" />
                        )}
                      </TableCell>
                      <TableCell>{user._count.postedTasks + user._count.assignedTasks}</TableCell>
                      <TableCell>{user._count.bids}</TableCell>
                      <TableCell>{user._count.contracts}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {user.accountStatus === AccountStatus.ACTIVE ? (
                            <Tooltip title="Suspend User">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleSuspend(user)}
                              >
                                <PersonOff />
                              </IconButton>
                            </Tooltip>
                          ) : user.accountStatus === AccountStatus.SUSPENDED ? (
                            <Tooltip title="Reactivate User">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleReactivate(user)}
                              >
                                <PersonAdd />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                        </Stack>
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

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'suspend' ? 'Suspend User' : 'Reactivate User'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedUser && (
              <Alert severity="info">
                {actionType === 'suspend'
                  ? `You are about to suspend ${selectedUser.email}. They will not be able to log in or use the platform.`
                  : `You are about to reactivate ${selectedUser.email}. They will regain full access to the platform.`}
              </Alert>
            )}
            {actionType === 'suspend' && (
              <TextField
                label="Reason (Optional)"
                multiline
                rows={3}
                fullWidth
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Provide a reason for suspending this user..."
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setActionDialogOpen(false);
            setActionReason('');
            setActionType(null);
            setSelectedUser(null);
          }} disabled={performingAction}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionType === 'suspend' ? 'error' : 'success'}
            onClick={performAction}
            disabled={performingAction}
          >
            {performingAction ? 'Processing...' : actionType === 'suspend' ? 'Suspend User' : 'Reactivate User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default AdminUserManagement;

