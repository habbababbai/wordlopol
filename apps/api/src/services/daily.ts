import {
  MAX_GUESSES,
  WORD_LENGTH,
  pickWordIndexForDate,
  type DailyChallengeDto,
  type GuessResultDto,
} from '@wordlopol/shared';

import { dateKeyToUtcDate, getCalendarDateKey } from '../lib/daily-date.js';
import { incrementGuestDailyGuess } from '../lib/guest-daily-session.js';
import { assertGuessInDictionary, normalizeGuessLength, scoreGuess } from '../lib/guess.js';
import { HttpError } from '../lib/http-error.js';
import { prisma } from '../lib/prisma.js';
import { isUniqueConstraintError } from '../lib/prisma-errors.js';
import { isWordInDictionary } from '../lib/word-dictionary.js';

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
    throw new HttpError(503, 'DICTIONARY_NOT_LOADED');
  }

  const index = pickWordIndexForDate(dateKey, wordCount);
  const word = await prisma.word.findFirst({
    where: { length: WORD_LENGTH },
    orderBy: { id: 'asc' },
    skip: index,
  });

  if (!word) {
    throw new HttpError(503, 'DICTIONARY_NOT_LOADED');
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
  guestSessionId?: string;
}

async function recordDailyCompletionInTx(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  dailyChallengeId: number,
  guesses: number,
  won: boolean,
): Promise<void> {
  try {
    await tx.gameResult.create({
      data: {
        userId,
        mode: 'DAILY',
        won,
        guesses,
        dailyChallengeId,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new HttpError(409, 'ALREADY_PLAYED_TODAY');
    }
    throw error;
  }

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
}

export async function submitDailyGuess(
  rawGuess: string,
  options: SubmitDailyGuessOptions = {},
): Promise<GuessResultDto> {
  const guess = normalizeGuessLength(rawGuess);
  await assertGuessInDictionary(guess, isWordInDictionary);

  const dateKey = getCalendarDateKey();
  const date = dateKeyToUtcDate(dateKey);
  const challenge = await getOrCreateDailyChallenge(dateKey);

  const answer = challenge.word.text;
  const { results, won } = scoreGuess(guess, answer);
  const { userId } = options;

  if (!userId) {
    if (!options.guestSessionId) {
      throw new HttpError(401, 'GUEST_SESSION_REQUIRED');
    }

    const guessNumber = await incrementGuestDailyGuess(options.guestSessionId, dateKey);
    const finished = won || guessNumber === MAX_GUESSES;

    return {
      results,
      won,
      finished,
      guessNumber,
      ...(finished ? { answer } : {}),
    };
  }

  return prisma.$transaction(async (tx) => {
    const existingResult = await tx.gameResult.findFirst({
      where: {
        userId,
        mode: 'DAILY',
        dailyChallengeId: challenge.id,
      },
    });
    if (existingResult) {
      throw new HttpError(409, 'ALREADY_PLAYED_TODAY');
    }

    const playerDay = await tx.dailyPlayerDay.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, guessCount: 0 },
      update: {},
    });

    if (playerDay.guessCount >= MAX_GUESSES) {
      throw new HttpError(400, 'GAME_ALREADY_FINISHED');
    }

    const guessNumber = playerDay.guessCount + 1;
    const finished = won || guessNumber === MAX_GUESSES;

    const claimed = await tx.dailyPlayerDay.updateMany({
      where: { userId, date, guessCount: playerDay.guessCount },
      data: { guessCount: guessNumber },
    });
    if (claimed.count !== 1) {
      throw new HttpError(409, 'CONCURRENT_GUESS_CONFLICT');
    }

    if (finished) {
      await recordDailyCompletionInTx(tx, userId, challenge.id, guessNumber, won);
    }

    return {
      results,
      won,
      finished,
      guessNumber,
      ...(finished ? { answer } : {}),
    };
  });
}
