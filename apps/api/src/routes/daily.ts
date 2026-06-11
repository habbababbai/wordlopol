import cookieParser from 'cookie-parser';
import { Router } from 'express';
import { z } from 'zod';
import { type DailyGuessRequestDto } from '@wordlopol/shared';

import { asyncHandler } from '../lib/async-handler.js';
import { ensureGuestDailySession, GUEST_DAILY_SESSION_COOKIE } from '../lib/guest-daily-session.js';
import { validateBody } from '../lib/validate-body.js';
import { dailyGuessRateLimit, dailyTodayRateLimit } from '../middleware/auth-rate-limit.js';
import { csrfProtection } from '../middleware/csrf.js';
import { optionalAuth } from '../middleware/optional-auth.js';
import { getTodayChallenge, submitDailyGuess } from '../services/daily.js';

const guessSchema = z.object({
  guess: z.string().trim().min(1),
}) satisfies z.ZodType<DailyGuessRequestDto>;

export const dailyRouter: Router = Router();

dailyRouter.use(cookieParser());
dailyRouter.use(csrfProtection);

dailyRouter.get(
  '/today',
  dailyTodayRateLimit,
  optionalAuth,
  asyncHandler(async (req, res) => {
    const challenge = await getTodayChallenge();

    if (!req.userId) {
      await ensureGuestDailySession(req, res);
    }

    res.json(challenge);
  }),
);

dailyRouter.post(
  '/guess',
  dailyGuessRateLimit,
  optionalAuth,
  validateBody(guessSchema),
  asyncHandler(async (req, res) => {
    const guestSessionId = req.userId
      ? undefined
      : (req.cookies[GUEST_DAILY_SESSION_COOKIE] as string | undefined);

    const result = await submitDailyGuess(req.body.guess, {
      userId: req.userId,
      guestSessionId,
    });
    res.json(result);
  }),
);
