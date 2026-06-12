import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '@/lib/tokens.js';

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (header?.startsWith('Bearer ')) {
    try {
      const { userId } = verifyAccessToken(header.slice(7));
      req.userId = userId;
    } catch {
      // Ignore invalid tokens for optional auth.
    }
  }

  next();
}
