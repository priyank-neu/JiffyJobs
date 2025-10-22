import React from 'react';
import { Button as MuiButton, ButtonProps, CircularProgress } from '@mui/material';

interface CustomButtonProps extends ButtonProps {
  loading?: boolean;
}

const Button: React.FC<CustomButtonProps> = ({ loading, children, disabled, ...props }) => {
  return (
    <MuiButton
      {...props}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : props.startIcon}
    >
      {children}
    </MuiButton>
  );
};

export default Button;