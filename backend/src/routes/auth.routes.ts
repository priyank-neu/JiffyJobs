import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authRateLimiter, strictRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Public routes with rate limiting
router.post('/signup', authRateLimiter, authController.signup);
router.post('/login', authRateLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/verify-email', authController.verifyEmail);
router.post('/forgot-password', strictRateLimiter, authController.forgotPassword);
router.post('/reset-password', strictRateLimiter, authController.resetPassword);

export default router;