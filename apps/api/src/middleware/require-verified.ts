import type { NextFunction, Request, Response } from 'express';

import { sendApiError } from '@/lib/send-api-error.js';

export function requireVerified(req: Request, res: Response, next: NextFunction): void {
  if (!req.userId) {
    sendApiError(res, 401, 'UNAUTHORIZED');
    return;
  }

  if (!req.emailVerified) {
    sendApiError(res, 403, 'EMAIL_NOT_VERIFIED');
    return;
  }

  next();
}
