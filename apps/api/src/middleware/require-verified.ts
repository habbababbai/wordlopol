import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export async function requireVerified(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { emailVerifiedAt: true },
  });

  if (!user?.emailVerifiedAt) {
    res.status(403).json({ error: 'Email not verified' });
    return;
  }

  next();
}
