import { Router } from 'express';
import { z } from 'zod';
import type { InfiniteGuessRequestDto } from '@wordlopol/shared';

import { asyncHandler } from '../lib/async-handler.js';
import { validateBody } from '../lib/validate-body.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireVerified } from '../middleware/require-verified.js';
import { getNextWord, submitInfiniteGuess } from '../services/infinite.js';

const guessSchema = z.object({
  guess: z.string().trim().min(1),
}) satisfies z.ZodType<InfiniteGuessRequestDto>;

export const infiniteRouter: Router = Router();

infiniteRouter.get(
  '/next',
  authenticate,
  requireVerified,
  asyncHandler(async (req, res) => {
    const word = await getNextWord(req.userId!);
    res.json(word);
  }),
);

infiniteRouter.post(
  '/guess',
  authenticate,
  requireVerified,
  validateBody(guessSchema),
  asyncHandler(async (req, res) => {
    const result = await submitInfiniteGuess(req.userId!, req.body.guess);
    res.json(result);
  }),
);
