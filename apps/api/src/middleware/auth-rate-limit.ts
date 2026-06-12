import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '@/config/env.js';
import { sendApiError } from '@/lib/send-api-error.js';

function shouldSkipRateLimit(): boolean {
  if (env.NODE_ENV === 'test') {
    return true;
  }

  if (env.RATE_LIMIT_ENABLED) {
    return false;
  }

  return env.NODE_ENV === 'development';
}

function rateLimitHandler(_req: Request, res: Response): void {
  sendApiError(res, 429, 'TOO_MANY_REQUESTS');
}

const sharedOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true as const,
  legacyHeaders: false as const,
  skip: () => shouldSkipRateLimit(),
  handler: rateLimitHandler,
};

export const authRouterRateLimit = rateLimit({ ...sharedOptions, max: 120 });
export const registerRateLimit = rateLimit({ ...sharedOptions, max: 5 });
export const loginRateLimit = rateLimit({ ...sharedOptions, max: 10 });
export const forgotPasswordRateLimit = rateLimit({ ...sharedOptions, max: 5 });
export const resetPasswordRateLimit = rateLimit({ ...sharedOptions, max: 5 });
export const resendVerificationRateLimit = rateLimit({ ...sharedOptions, max: 5 });
export const verifyEmailRateLimit = rateLimit({ ...sharedOptions, max: 20 });
export const refreshRateLimit = rateLimit({ ...sharedOptions, max: 60 });
export const logoutRateLimit = rateLimit({ ...sharedOptions, max: 30 });
export const csrfTokenRateLimit = rateLimit({ ...sharedOptions, max: 120 });
export const authenticatedRateLimit = rateLimit({ ...sharedOptions, max: 120 });
export const dailyTodayRateLimit = rateLimit({ ...sharedOptions, max: 120 });
export const dailyGuessRateLimit = rateLimit({ ...sharedOptions, max: 120 });
