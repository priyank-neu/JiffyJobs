import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt.util';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service';

/**
 * Service for user authentication operations including signup, login, email verification, and password management.
 * 
 * @module auth.service
 * @description Handles all authentication-related business logic including user registration,
 * login, email verification, and password reset functionality.
 */

/**
 * Creates a new user account and sends verification email.
 * 
 * @param {string} email - User's email address (must be unique)
 * @param {string} password - User's password (will be hashed before storage)
 * @param {string} [name] - Optional user's display name
 * @param {string} [phoneNumber] - Optional user's phone number
 * @returns {Promise<{token: string, user: {userId: string, email: string, name: string | null, isVerified: boolean, role: string}}>}
 *   Object containing JWT token and user information (without sensitive data)
 * @throws {Error} If email already exists
 * 
 * @example
 * const result = await signup('user@example.com', 'password123', 'John Doe');
 * // Returns: { token: 'jwt-token...', user: { userId: '...', email: '...', ... } }
 */
export const signup = async (
  email: string,
  password: string,
  name?: string,
  phoneNumber?: string
) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      phoneNumber,
      isVerified: false,
    },
  });

  // Create verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

  await prisma.verification.create({
    data: {
      userId: user.userId,
      verificationType: 'EMAIL',
      token: verificationToken,
      expiresAt,
    },
  });

  // Send verification email
  await sendVerificationEmail(email, verificationToken);

  // Generate JWT
  const token = generateToken({
    userId: user.userId,
    email: user.email,
  });

  return {
    token,
    user: {
      userId: user.userId,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      role: user.role,
    },
  };
};

/**
 * Authenticates a user with email and password.
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's password (plain text)
 * @returns {Promise<{token: string, user: {userId: string, email: string, name: string | null, isVerified: boolean, role: string}}>}
 *   Object containing JWT token and user information
 * @throws {Error} If credentials are invalid or account is not active
 * 
 * @example
 * const result = await login('user@example.com', 'password123');
 * // Returns: { token: 'jwt-token...', user: { userId: '...', email: '...', ... } }
 */
export const login = async (email: string, password: string) => {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if account is active
  if (user.accountStatus !== 'ACTIVE') {
    throw new Error('Account is suspended or deleted');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT
  const token = generateToken({
    userId: user.userId,
    email: user.email,
  });

  return {
    token,
    user: {
      userId: user.userId,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      role: user.role,
    },
  };
};

/**
 * Verifies a user's email address using a verification token.
 * 
 * @param {string} token - Email verification token (from verification email)
 * @returns {Promise<{message: string}>} Success message
 * @throws {Error} If token is invalid, expired, or already used
 * 
 * @example
 * await verifyEmail('verification-token-from-email');
 * // Updates user.isVerified to true and marks token as used
 */
export const verifyEmail = async (token: string) => {
  const verification = await prisma.verification.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verification) {
    throw new Error('Invalid verification token');
  }

  if (verification.isUsed) {
    throw new Error('Verification token already used');
  }

  if (new Date() > verification.expiresAt) {
    throw new Error('Verification token expired');
  }

  // Update user and verification
  await prisma.$transaction([
    prisma.user.update({
      where: { userId: verification.userId },
      data: { isVerified: true },
    }),
    prisma.verification.update({
      where: { verificationId: verification.verificationId },
      data: { isUsed: true },
    }),
  ]);

  return { message: 'Email verified successfully' };
};

/**
 * Initiates password reset process by sending reset email.
 * 
 * @param {string} email - User's email address
 * @returns {Promise<{message: string}>} Generic message (doesn't reveal if email exists)
 * 
 * @example
 * await forgotPassword('user@example.com');
 * // Creates reset token and sends password reset email
 */
export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if user exists
    return { message: 'If an account exists, a password reset email has been sent' };
  }

  // Create reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

  await prisma.passwordReset.create({
    data: {
      userId: user.userId,
      token: resetToken,
      expiresAt,
    },
  });

  // Send reset email
  await sendPasswordResetEmail(email, resetToken);

  return { message: 'If an account exists, a password reset email has been sent' };
};

/**
 * Resets user password using a reset token.
 * 
 * @param {string} token - Password reset token (from reset email)
 * @param {string} newPassword - New password (will be hashed before storage)
 * @returns {Promise<{message: string}>} Success message
 * @throws {Error} If token is invalid, expired, or already used
 * 
 * @example
 * await resetPassword('reset-token-from-email', 'newSecurePassword123');
 * // Updates user password and marks token as used
 */
export const resetPassword = async (token: string, newPassword: string) => {
  const passwordReset = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!passwordReset) {
    throw new Error('Invalid reset token');
  }

  if (passwordReset.isUsed) {
    throw new Error('Reset token already used');
  }

  if (new Date() > passwordReset.expiresAt) {
    throw new Error('Reset token expired');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password and mark token as used
  await prisma.$transaction([
    prisma.user.update({
      where: { userId: passwordReset.userId },
      data: { passwordHash },
    }),
    prisma.passwordReset.update({
      where: { resetId: passwordReset.resetId },
      data: { isUsed: true },
    }),
  ]);

  return { message: 'Password reset successfully' };
};