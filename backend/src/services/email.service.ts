import { Resend } from 'resend';
import config from '../config/env';

const resend = new Resend(config.RESEND_API_KEY);

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: `${config.EMAIL_FROM_NAME} <${config.EMAIL_FROM}>`,
      to: email,
      subject: 'Verify Your Email - JiffyJobs',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to JiffyJobs!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #0ea5e9; 
                    color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Verify Email
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 14px;">${verificationUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    // In development, log the verification URL
    if (config.NODE_ENV === 'development') {
      console.log('Verification URL:', verificationUrl);
    }
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: `${config.EMAIL_FROM_NAME} <${config.EMAIL_FROM}>`,
      to: email,
      subject: 'Reset Your Password - JiffyJobs',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Click the button below to proceed:</p>
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #0ea5e9; 
                    color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Reset Password
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 14px;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    if (config.NODE_ENV === 'development') {
      console.log('Password reset URL:', resetUrl);
    }
  }
};