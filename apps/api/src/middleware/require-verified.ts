import type { NextFunction, Request, Response } from 'express';

import { prisma } from '@/lib/prisma.js';
import { sendApiError } from '@/lib/send-api-error.js';

export async function requireVerified(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.userId) {
    sendApiError(res, 401, 'UNAUTHORIZED');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { emailVerifiedAt: true },
  });

  if (!user?.emailVerifiedAt) {
    sendApiError(res, 403, 'EMAIL_NOT_VERIFIED');
    return;
  }

  next();
}
