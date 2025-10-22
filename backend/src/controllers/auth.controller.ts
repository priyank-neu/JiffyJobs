import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { isValidEmail, isValidPassword, sanitizeEmail } from '../utils/validation.util';
import config from '../config/env';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, phoneNumber } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const sanitizedEmail = sanitizeEmail(email);

    if (!isValidEmail(sanitizedEmail)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    if (!isValidPassword(password)) {
      res.status(400).json({
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number',
      });
      return;
    }

    // Create user
    const result = await authService.signup(
      sanitizedEmail,
      password,
      name,
      phoneNumber
    );

    // Set cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: 'User created successfully. Please check your email to verify your account.',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Signup failed' });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const sanitizedEmail = sanitizeEmail(email);

    // Login user
    const result = await authService.login(sanitizedEmail, password);

    // Set cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Login successful',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Login failed' });
    }
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Verification token is required' });
      return;
    }

    const result = await authService.verifyEmail(token);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Email verification failed' });
    }
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const sanitizedEmail = sanitizeEmail(email);

    if (!isValidEmail(sanitizedEmail)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    const result = await authService.forgotPassword(sanitizedEmail);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Password reset request failed' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    if (!isValidPassword(newPassword)) {
      res.status(400).json({
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number',
      });
      return;
    }

    const result = await authService.resetPassword(token, newPassword);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Password reset failed' });
    }
  }
};