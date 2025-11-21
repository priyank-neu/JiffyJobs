import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

type InputProps = TextFieldProps;

const Input: React.FC<InputProps> = (props) => {
  return (
    <TextField
      fullWidth
      variant="outlined"
      {...props}
    />
  );
};

export default Input;