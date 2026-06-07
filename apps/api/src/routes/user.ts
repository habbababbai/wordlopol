import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getUserProfile, UserError } from '../services/user.js';

function handleUserRoute(
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
      if (error instanceof UserError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      next(error);
    }
  };
}

export const userRouter: Router = Router();

userRouter.get(
  '/profile',
  authenticate,
  handleUserRoute(async (req, res, _next) => {
    const profile = await getUserProfile(req.userId!);
    res.json(profile);
  }),
);
