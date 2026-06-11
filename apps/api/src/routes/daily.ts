import { Router } from 'express';
import { z } from 'zod';
import { MAX_GUESSES, type DailyGuessRequestDto } from '@wordlopol/shared';

import { asyncHandler } from '../lib/async-handler.js';
import { validateBody } from '../lib/validate-body.js';
import { dailyGuessRateLimit, dailyTodayRateLimit } from '../middleware/auth-rate-limit.js';
import { optionalAuth } from '../middleware/optional-auth.js';
import { getTodayChallenge, submitDailyGuess } from '../services/daily.js';

const guessSchema = z.object({
  guess: z.string().trim().min(1),
  guessNumber: z.number().int().min(1).max(MAX_GUESSES).optional(),
}) satisfies z.ZodType<DailyGuessRequestDto>;

export const dailyRouter: Router = Router();

dailyRouter.get(
  '/today',
  dailyTodayRateLimit,
  asyncHandler(async (_req, res) => {
    const challenge = await getTodayChallenge();
    res.json(challenge);
  }),
);

dailyRouter.post(
  '/guess',
  dailyGuessRateLimit,
  optionalAuth,
  validateBody(guessSchema),
  asyncHandler(async (req, res) => {
    const result = await submitDailyGuess(req.body.guess, {
      userId: req.userId,
      guessNumber: req.body.guessNumber,
    });
    res.json(result);
  }),
);
