import {
  MAX_GUESSES,
  WORD_LENGTH,
  pickWordIndexForDate,
  type DailyChallengeDto,
} from '@wordlopol/shared';
import { dateKeyToUtcDate, getCalendarDateKey } from '../lib/daily-date.js';
import { prisma } from '../lib/prisma.js';

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  );
}

export class DailyError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'DailyError';
    this.statusCode = statusCode;
  }
}

export async function getOrCreateDailyChallenge(dateKey: string) {
  const date = dateKeyToUtcDate(dateKey);

  const existing = await prisma.dailyChallenge.findUnique({
    where: { date },
    include: { word: true },
  });

  if (existing) {
    return existing;
  }

  const wordCount = await prisma.word.count({
    where: { length: WORD_LENGTH },
  });
  if (wordCount === 0) {
    throw new DailyError(503, 'Dictionary not loaded');
  }

  const index = pickWordIndexForDate(dateKey, wordCount);
  const word = await prisma.word.findFirst({
    where: { length: WORD_LENGTH },
    orderBy: { id: 'asc' },
    skip: index,
  });

  if (!word) {
    throw new DailyError(503, 'Dictionary not loaded');
  }

  try {
    return await prisma.dailyChallenge.create({
      data: { date, wordId: word.id },
      include: { word: true },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return prisma.dailyChallenge.findUniqueOrThrow({
        where: { date },
        include: { word: true },
      });
    }
    throw error;
  }
}

export async function getTodayChallenge(): Promise<DailyChallengeDto> {
  const dateKey = getCalendarDateKey();
  await getOrCreateDailyChallenge(dateKey);

  return {
    date: dateKey,
    maxGuesses: MAX_GUESSES,
    wordLength: WORD_LENGTH,
  };
}
