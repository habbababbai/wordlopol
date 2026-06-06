import { Router } from 'express';
import { DailyError, getTodayChallenge } from '../services/daily.js';

function handleDailyRoute(
  handler: (req: import('express').Request, res: import('express').Response) => Promise<void>,
) {
  return async (req: import('express').Request, res: import('express').Response) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof DailyError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      throw error;
    }
  };
}

export const dailyRouter: Router = Router();

dailyRouter.get(
  '/today',
  handleDailyRoute(async (_req, res) => {
    const challenge = await getTodayChallenge();
    res.json(challenge);
  }),
);
