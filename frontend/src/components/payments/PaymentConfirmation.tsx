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
  CircularProgress,
  Stack,
} from '@mui/material';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { paymentAPI } from '@/services/api.service';

// Get publishable key from environment
const getStripePublishableKey = () => {
  // Get from environment variable (should be set in .env file)
  return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
};

interface PaymentConfirmationProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientSecret: string;
  amount: number;
  taskTitle: string;
}

const PaymentForm: React.FC<{
  clientSecret: string;
  amount: number;
  taskTitle: string;
  onSuccess: () => void;
  onClose: () => void;
}> = ({ clientSecret, amount, taskTitle, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'An error occurred');
        setProcessing(false);
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        setProcessing(false);
      } else {
        // Payment succeeded
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Complete Payment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Task: {taskTitle}
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            Amount: ${amount.toFixed(2)}
          </Typography>
        </Box>

        <PaymentElement />

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <DialogActions sx={{ px: 0 }}>
          <Button onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!stripe || processing}
            startIcon={processing ? <CircularProgress size={20} /> : null}
          >
            {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
          </Button>
        </DialogActions>
      </Stack>
    </form>
  );
};

const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  open,
  onClose,
  onSuccess,
  clientSecret,
  amount,
  taskTitle,
}) => {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [loadingKey, setLoadingKey] = useState(true);

  useEffect(() => {
    const loadStripeKey = async () => {
      try {
        // First try environment variable
        let publishableKey = getStripePublishableKey();
        
        // If not in env, get from backend
        if (!publishableKey) {
          const { paymentAPI } = await import('@/services/api.service');
          const response = await paymentAPI.getPublishableKey();
          publishableKey = response.publishableKey;
        }

        if (publishableKey) {
          setStripePromise(loadStripe(publishableKey));
        } else {
          console.error('Stripe publishable key not found');
        }
      } catch (error) {
        console.error('Error loading Stripe key:', error);
      } finally {
        setLoadingKey(false);
      }
    };

    loadStripeKey();
  }, []);

  if (loadingKey) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!stripePromise) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Alert severity="error">
            Stripe is not configured. Please ensure STRIPE_PUBLISHABLE_KEY is set in your backend environment.
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Complete Payment</DialogTitle>
      <DialogContent>
        <Elements stripe={stripePromise} options={options}>
          <PaymentForm
            clientSecret={clientSecret}
            amount={amount}
            taskTitle={taskTitle}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentConfirmation;

