import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireVerified } from '../middleware/require-verified.js';
import { InfiniteError, getNextWord } from '../services/infinite.js';

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
      if (error instanceof InfiniteError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      next(error);
    }
  };
}

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
