import { Router } from 'express';

import { asyncHandler } from '@/lib/async-handler.js';
import { authenticatedRateLimit } from '@/middleware/auth-rate-limit.js';
import { authenticate } from '@/middleware/authenticate.js';
import { getUserProfile } from '@/services/user.js';

export const userRouter: Router = Router();

userRouter.get(
  '/profile',
  authenticatedRateLimit,
  authenticate,
  asyncHandler(async (req, res) => {
    const profile = await getUserProfile(req.userId!);
    res.json(profile);
  }),
);
