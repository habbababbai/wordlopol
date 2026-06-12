import type { NextFunction, Request, Response } from 'express';
import { formatApiErrorResponse } from '@wordlopol/shared';
import { z } from 'zod';

import { HttpError } from '@/lib/http-error.js';
import { logger } from '@/lib/logger.js';
import { isInvalidCsrfTokenError } from './csrf.js';

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (isInvalidCsrfTokenError(error)) {
    res.status(403).json(formatApiErrorResponse('INVALID_CSRF_TOKEN'));
    return;
  }

  if (error instanceof z.ZodError) {
    res.status(400).json(formatApiErrorResponse('VALIDATION_ERROR'));
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json(formatApiErrorResponse(error.code, error.message));
    return;
  }

  logger.error({ err: error, requestId: req.requestId }, 'Unhandled API error');

  res.status(500).json(formatApiErrorResponse('INTERNAL_ERROR'));
}
