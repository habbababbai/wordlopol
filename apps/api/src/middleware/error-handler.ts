import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { HttpError } from '../lib/http-error.js';
import { logger } from '../lib/logger.js';
import { isInvalidCsrfTokenError } from './csrf.js';

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

  if (isInvalidCsrfTokenError(error)) {
    res.status(403).json({ error: 'Invalid CSRF token' });
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

  logger.error({ err: error, requestId: _req.requestId }, 'Unhandled API error');

  res.status(500).json({ error: 'Internal server error' });
}
