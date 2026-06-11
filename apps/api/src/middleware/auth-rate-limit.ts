import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

function shouldSkipRateLimit(): boolean {
  if (env.NODE_ENV === 'test') {
    return true;
  }

  if (env.RATE_LIMIT_ENABLED) {
    return false;
  }

  return env.NODE_ENV === 'development';
}

function createAuthRateLimiter(max: number) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => shouldSkipRateLimit(),
    handler: (_req, res) => {
      res.status(429).json({ error: 'Too many requests' });
    },
  });
}

export const registerRateLimit = createAuthRateLimiter(5);
export const loginRateLimit = createAuthRateLimiter(10);
export const forgotPasswordRateLimit = createAuthRateLimiter(5);
export const resetPasswordRateLimit = createAuthRateLimiter(5);
export const resendVerificationRateLimit = createAuthRateLimiter(5);
export const verifyEmailRateLimit = createAuthRateLimiter(20);
export const refreshRateLimit = createAuthRateLimiter(60);
export const authenticatedRateLimit = createAuthRateLimiter(120);
export const dailyTodayRateLimit = createAuthRateLimiter(120);
export const dailyGuessRateLimit = createAuthRateLimiter(120);
