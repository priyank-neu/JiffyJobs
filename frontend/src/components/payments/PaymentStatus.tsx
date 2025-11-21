import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Button,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Payment,
  Receipt,
  Error as ErrorIcon,
  Refresh,
} from '@mui/icons-material';
import { PaymentStatus as PaymentStatusEnum } from '@/types/task.types';
import { paymentAPI } from '@/services/api.service';
import { Contract } from '@/types/task.types';

interface PaymentStatusProps {
  contract: Contract;
  onRefresh?: () => void;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({ contract, onRefresh }) => {
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contract.contractId) {
      fetchPaymentHistory();
    }
  }, [contract.contractId]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPaymentHistory(contract.contractId);
      setPaymentHistory(response.payments || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: PaymentStatusEnum) => {
    switch (status) {
      case PaymentStatusEnum.COMPLETED:
        return 'success';
      case PaymentStatusEnum.PROCESSING:
        return 'warning';
      case PaymentStatusEnum.FAILED:
        return 'error';
      case PaymentStatusEnum.REFUNDED:
      case PaymentStatusEnum.PARTIALLY_REFUNDED:
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status?: PaymentStatusEnum) => {
    switch (status) {
      case PaymentStatusEnum.PENDING:
        return 'Payment Pending';
      case PaymentStatusEnum.PROCESSING:
        return 'Processing Payment';
      case PaymentStatusEnum.COMPLETED:
        return 'Payment Completed';
      case PaymentStatusEnum.FAILED:
        return 'Payment Failed';
      case PaymentStatusEnum.REFUNDED:
        return 'Refunded';
      case PaymentStatusEnum.PARTIALLY_REFUNDED:
        return 'Partially Refunded';
      default:
        return 'Unknown';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Payment Status</Typography>
            <Chip
              icon={
                contract.paymentStatus === PaymentStatusEnum.COMPLETED ? (
                  <CheckCircle />
                ) : contract.paymentStatus === PaymentStatusEnum.FAILED ? (
                  <ErrorIcon />
                ) : (
                  <Payment />
                )
              }
              label={getStatusLabel(contract.paymentStatus)}
              color={getStatusColor(contract.paymentStatus) as any}
            />
          </Box>

          <Divider />

          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Agreed Amount
              </Typography>
              <Typography variant="h6">{formatCurrency(contract.agreedAmount)}</Typography>
            </Box>

            {contract.platformFee && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Platform Fee ({((contract.platformFee / contract.agreedAmount) * 100).toFixed(1)}%)
                </Typography>
                <Typography variant="body1">{formatCurrency(contract.platformFee)}</Typography>
              </Box>
            )}

            {contract.helperAmount && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Helper Payout
                </Typography>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(contract.helperAmount)}
                </Typography>
              </Box>
            )}

            {contract.refundAmount && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Refund Amount
                </Typography>
                <Typography variant="h6" color="error.main">
                  -{formatCurrency(contract.refundAmount)}
                </Typography>
              </Box>
            )}
          </Stack>

          {contract.paymentCompletedAt && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Payment Completed
              </Typography>
              <Typography variant="body2">{formatDate(contract.paymentCompletedAt)}</Typography>
            </Box>
          )}

          {contract.payoutReleasedAt && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Payout Released
              </Typography>
              <Typography variant="body2">{formatDate(contract.payoutReleasedAt)}</Typography>
            </Box>
          )}

          {contract.autoReleaseAt && !contract.payoutReleasedAt && (
            <Alert severity="info">
              Payout will be automatically released on {formatDate(contract.autoReleaseAt)}
            </Alert>
          )}

          {paymentHistory.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Payment History
              </Typography>
              <Stack spacing={1}>
                {paymentHistory.map((payment, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {payment.type === 'CHARGE' && 'Charge'}
                        {payment.type === 'PAYOUT' && 'Payout'}
                        {payment.type === 'REFUND' && 'Refund'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(payment.createdAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        color={
                          payment.type === 'REFUND'
                            ? 'error.main'
                            : payment.type === 'PAYOUT'
                            ? 'success.main'
                            : 'text.primary'
                        }
                      >
                        {payment.type === 'REFUND' ? '-' : payment.type === 'PAYOUT' ? '+' : ''}
                        {formatCurrency(payment.amount)}
                      </Typography>
                      <Chip
                        label={payment.status}
                        size="small"
                        color={getStatusColor(payment.status) as any}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          <Button
            startIcon={<Refresh />}
            onClick={async () => {
              try {
                setLoading(true);
                // Sync payment status from Stripe
                await paymentAPI.syncPaymentStatus(contract.contractId);
                // Then refresh the data
                await fetchPaymentHistory();
                if (onRefresh) {
                  onRefresh();
                }
              } catch (error) {
                console.error('Error syncing payment status:', error);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            variant="outlined"
            fullWidth
          >
            {loading ? <CircularProgress size={20} /> : 'Refresh Status'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PaymentStatus;

