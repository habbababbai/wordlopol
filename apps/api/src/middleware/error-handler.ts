import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { HttpError } from '../lib/http-error.js';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof z.ZodError) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
}
