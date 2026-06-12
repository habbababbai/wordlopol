import type { NextFunction, Request, Response } from 'express';

import { sendApiError } from '@/lib/send-api-error.js';
import { verifyAccessToken } from '@/lib/tokens.js';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    sendApiError(res, 401, 'UNAUTHORIZED');
    return;
  }

  try {
    const { userId } = verifyAccessToken(header.slice(7));
    req.userId = userId;
    next();
  } catch {
    sendApiError(res, 401, 'UNAUTHORIZED');
  }
}
