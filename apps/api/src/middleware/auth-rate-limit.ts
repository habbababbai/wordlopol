import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

function createAuthRateLimiter(max: number) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test' || env.NODE_ENV === 'development',
    handler: (_req, res) => {
      res.status(429).json({ error: 'Too many requests' });
    },
  });
}

export const registerRateLimit = createAuthRateLimiter(5);
export const loginRateLimit = createAuthRateLimiter(10);
export const forgotPasswordRateLimit = createAuthRateLimiter(5);
export const resendVerificationRateLimit = createAuthRateLimiter(5);
