import type { NextFunction, Request, Response } from 'express';

import { sendApiError } from '@/lib/send-api-error.js';

/**
 * Trusts the `emailVerified` claim minted at login/refresh (see `signAccessToken`).
 * Verification downgrades take effect after access token expiry (15 min) or on the next
 * refresh, which re-reads `emailVerifiedAt` from the database.
 */
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
