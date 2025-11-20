import rateLimit from 'express-rate-limit';
import config from '../config/env';

export const authRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: 'Too many attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// Message Rate Limiter - REMOVED
// ============================================================================
// The messageRateLimiter export has been completely removed to avoid IPv6
// validation errors with express-rate-limit v8.1.0. The error was:
// "Custom keyGenerator appears to use request IP without calling the 
//  ipKeyGenerator helper function for IPv6 addresses"
//
// If rate limiting for messages is needed in the future, implement it in the
// chat service layer using a simple in-memory cache or database-based approach.
// ============================================================================