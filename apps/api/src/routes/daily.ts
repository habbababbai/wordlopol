import { Router } from 'express';
import { z } from 'zod';
import { MAX_GUESSES } from '@wordlopol/shared';
import { optionalAuth } from '../middleware/optional-auth.js';
import { DailyError, getTodayChallenge, submitDailyGuess } from '../services/daily.js';

function handleDailyRoute(
  handler: (
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction,
  ) => Promise<void>,
) {
  return async (
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction,
  ) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request' });
        return;
      }

      if (error instanceof DailyError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      next(error);
    }
  };
}

const guessSchema = z.object({
  guess: z.string().trim().min(1),
  guessNumber: z.number().int().min(1).max(MAX_GUESSES).optional(),
});

export const dailyRouter: Router = Router();

dailyRouter.get(
  '/today',
  handleDailyRoute(async (_req, res, _next) => {
    const challenge = await getTodayChallenge();
    res.json(challenge);
  }),
);

dailyRouter.post(
  '/guess',
  optionalAuth,
  handleDailyRoute(async (req, res, _next) => {
    const body = guessSchema.parse(req.body);
    const result = await submitDailyGuess(body.guess, {
      userId: req.userId,
      guessNumber: body.guessNumber,
    });
    res.json(result);
  }),
);
