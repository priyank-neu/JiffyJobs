import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

// Mock the API service
vi.mock('../services/api.service', () => ({
  authAPI: {
    login: vi.fn(),
  },
}));

describe('LoginForm', () => {
  const renderLoginForm = () => {
    return render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );
  };

  it('should render login form with email and password fields', () => {
    renderLoginForm();
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should display validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderLoginForm();
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('should display validation error for empty password', async () => {
    const user = userEvent.setup();
    renderLoginForm();
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });
});

