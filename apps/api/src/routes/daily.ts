import { Router } from 'express';
import { DailyError, getTodayChallenge } from '../services/daily.js';

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
      if (error instanceof DailyError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      next(error);
    }
  };
}

export const dailyRouter: Router = Router();

dailyRouter.get(
  '/today',
  handleDailyRoute(async (_req, res, _next) => {
    const challenge = await getTodayChallenge();
    res.json(challenge);
  }),
);
