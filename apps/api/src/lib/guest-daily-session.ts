import type { CookieOptions, Request, Response } from 'express';
import { MAX_GUESSES } from '@wordlopol/shared';

import { env } from '../config/env.js';
import { dateKeyToUtcDate, getCalendarDateKey } from './daily-date.js';
import { HttpError } from './http-error.js';
import { prisma } from './prisma.js';

export const GUEST_DAILY_SESSION_COOKIE = 'daily_guest_session';

const GUEST_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function getGuestDailySessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: env.GUEST_DAILY_SESSION_COOKIE_PATH,
    maxAge: GUEST_SESSION_TTL_MS,
  };
}

function isSameCalendarDate(stored: Date, dateKey: string): boolean {
  return stored.getTime() === dateKeyToUtcDate(dateKey).getTime();
}

async function deleteStaleGuestDailySessions(todayDateKey: string): Promise<void> {
  await prisma.guestDailySession.deleteMany({
    where: { date: { lt: dateKeyToUtcDate(todayDateKey) } },
  });
}

export async function ensureGuestDailySession(req: Request, res: Response): Promise<string> {
  const dateKey = getCalendarDateKey();
  const date = dateKeyToUtcDate(dateKey);
  const existingId = req.cookies[GUEST_DAILY_SESSION_COOKIE] as string | undefined;

  await deleteStaleGuestDailySessions(dateKey);

  if (existingId) {
    const session = await prisma.guestDailySession.findUnique({ where: { id: existingId } });
    if (session && isSameCalendarDate(session.date, dateKey)) {
      return session.id;
    }
  }

  const session = await prisma.guestDailySession.create({
    data: { date, guessCount: 0 },
  });

  res.cookie(GUEST_DAILY_SESSION_COOKIE, session.id, getGuestDailySessionCookieOptions());

  return session.id;
}

export async function incrementGuestDailyGuess(
  sessionId: string,
  dateKey: string,
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const session = await tx.guestDailySession.findUnique({ where: { id: sessionId } });

    if (!session || !isSameCalendarDate(session.date, dateKey)) {
      throw new HttpError(401, 'Guest session required');
    }

    if (session.guessCount >= MAX_GUESSES) {
      throw new HttpError(400, 'Game already finished');
    }

    const guessNumber = session.guessCount + 1;
    const claimed = await tx.guestDailySession.updateMany({
      where: { id: sessionId, guessCount: session.guessCount },
      data: { guessCount: guessNumber },
    });

    if (claimed.count !== 1) {
      throw new HttpError(409, 'Concurrent guess conflict');
    }

    return guessNumber;
  });
}
