import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { requireVerified } from '../middleware/require-verified.js';
import { InfiniteError, getNextWord, submitInfiniteGuess } from '../services/infinite.js';

function handleInfiniteRoute(
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

      if (error instanceof InfiniteError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      next(error);
    }
  };
}

const guessSchema = z.object({
  guess: z.string().trim().min(1),
});

export const infiniteRouter: Router = Router();

infiniteRouter.get(
  '/next',
  authenticate,
  requireVerified,
  handleInfiniteRoute(async (req, res, _next) => {
    const word = await getNextWord(req.userId!);
    res.json(word);
  }),
);

infiniteRouter.post(
  '/guess',
  authenticate,
  requireVerified,
  handleInfiniteRoute(async (req, res, _next) => {
    const body = guessSchema.parse(req.body);
    const result = await submitInfiniteGuess(req.userId!, body.guess);
    res.json(result);
  }),
);
