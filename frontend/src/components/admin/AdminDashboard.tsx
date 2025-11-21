import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Report,
  Warning,
  CheckCircle,
  Cancel,
  History,
  People,
} from '@mui/icons-material';
import { reportAPI } from '@/services/api.service';
import { ReportMetrics } from '@/types/report.types';
import AdminReportsQueue from './AdminReportsQueue';
import AdminAuditLogs from './AdminAuditLogs';
import AdminUserManagement from './AdminUserManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportAPI.getReportMetrics();
      setMetrics(response.metrics);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading && !metrics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Metrics Cards */}
      {metrics && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Warning color="error" />
                <Box>
                  <Typography variant="h4">{metrics.total.OPEN}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Open Reports
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="h4">{metrics.total.RESOLVED}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Resolved Reports
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Cancel sx={{ color: 'text.secondary' }} />
                <Box>
                  <Typography variant="h4">{metrics.total.CLOSED}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Closed Reports
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Report color="primary" />
                <Box>
                  <Typography variant="h4">
                    {metrics.total.OPEN + metrics.total.RESOLVED + metrics.total.CLOSED}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Reports
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Breakdown by Type */}
      {metrics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Reports by Type
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              {Object.entries(metrics.byType).map(([type, counts]) => (
                <Box key={type}>
                  <Typography variant="subtitle2" gutterBottom>
                    {type}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={`Open: ${counts.OPEN}`}
                      color="error"
                      size="small"
                    />
                    <Chip
                      label={`Resolved: ${counts.RESOLVED}`}
                      color="success"
                      size="small"
                    />
                    <Chip
                      label={`Closed: ${counts.CLOSED}`}
                      color="default"
                      size="small"
                    />
                  </Stack>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Reports Queue" icon={<Report />} iconPosition="start" />
            <Tab label="User Management" icon={<People />} iconPosition="start" />
            <Tab label="Audit Logs" icon={<History />} iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <AdminReportsQueue onAction={fetchMetrics} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AdminUserManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <AdminAuditLogs />
        </TabPanel>
      </Card>
    </Box>
  );
};

export default AdminDashboard;

