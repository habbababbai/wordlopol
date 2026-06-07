import {
  MAX_GUESSES,
  WORD_LENGTH,
  evaluateGuess,
  pickWordIndexForDate,
  type DailyChallengeDto,
  type GuessResultDto,
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

export interface SubmitDailyGuessOptions {
  userId?: string;
  guessNumber?: number;
}

async function recordDailyCompletion(
  userId: string,
  dailyChallengeId: number,
  guesses: number,
  won: boolean,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.gameResult.create({
      data: {
        userId,
        mode: 'DAILY',
        won,
        guesses,
        dailyChallengeId,
      },
    });

    await tx.userStats.upsert({
      where: { userId },
      create: {
        userId,
        dailyPlayed: 1,
        dailyWon: won ? 1 : 0,
      },
      update: {
        dailyPlayed: { increment: 1 },
        ...(won ? { dailyWon: { increment: 1 } } : {}),
      },
    });
  });
}

export async function submitDailyGuess(
  rawGuess: string,
  options: SubmitDailyGuessOptions = {},
): Promise<GuessResultDto> {
  const guess = rawGuess.trim().toLowerCase();

  if (guess.length !== WORD_LENGTH) {
    throw new DailyError(400, `Guess must be ${WORD_LENGTH} letters`);
  }

  const dateKey = getCalendarDateKey();
  const date = dateKeyToUtcDate(dateKey);
  const challenge = await getOrCreateDailyChallenge(dateKey);

  const dictionaryWord = await prisma.word.findUnique({
    where: { text: guess },
  });
  if (!dictionaryWord) {
    throw new DailyError(400, 'Not in dictionary');
  }

  const { userId } = options;
  let guessNumber: number;

  if (userId) {
    const existingResult = await prisma.gameResult.findFirst({
      where: {
        userId,
        mode: 'DAILY',
        dailyChallengeId: challenge.id,
      },
    });
    if (existingResult) {
      throw new DailyError(409, 'Already played today');
    }

    const playerDay = await prisma.dailyPlayerDay.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, guessCount: 0 },
      update: {},
    });

    if (playerDay.guessCount >= MAX_GUESSES) {
      throw new DailyError(400, 'Game already finished');
    }

    guessNumber = playerDay.guessCount + 1;
  } else {
    if (options.guessNumber == null) {
      throw new DailyError(400, 'guessNumber is required for guest play');
    }
    if (options.guessNumber < 1 || options.guessNumber > MAX_GUESSES) {
      throw new DailyError(400, `guessNumber must be between 1 and ${MAX_GUESSES}`);
    }
    guessNumber = options.guessNumber;
  }

  const answer = challenge.word.text;
  const results = evaluateGuess(guess, answer);
  const won = results.every((result) => result === 'correct');
  const finished = won || guessNumber === MAX_GUESSES;

  if (userId) {
    await prisma.dailyPlayerDay.update({
      where: { userId_date: { userId, date } },
      data: { guessCount: guessNumber },
    });

    if (finished) {
      await recordDailyCompletion(userId, challenge.id, guessNumber, won);
    }
  }

  return {
    results,
    won,
    finished,
    guessNumber,
    ...(finished ? { answer } : {}),
  };
}
