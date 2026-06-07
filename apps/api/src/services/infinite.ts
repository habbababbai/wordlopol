import {
  INFINITE_POOL_SIZE,
  MAX_GUESSES,
  WORD_LENGTH,
  buildCyclePickOrder,
  evaluateGuess,
  pickPoolWordIndexForDate,
  type GuessResultDto,
  type InfiniteWordDto,
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

export class InfiniteError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'InfiniteError';
    this.statusCode = statusCode;
  }
}

type PoolEntry = Awaited<ReturnType<typeof getOrCreateDailyPool>>[number];

function buildInfiniteWordDto(
  dateKey: string,
  wordNumber: number,
  poolSize: number,
): InfiniteWordDto {
  return {
    date: dateKey,
    wordNumber,
    poolSize,
    maxGuesses: MAX_GUESSES,
    wordLength: WORD_LENGTH,
  };
}

function cycleSeed(userId: string, dateKey: string, cycleNumber: number): string {
  return `${userId}:${dateKey}:${cycleNumber}`;
}

async function loadFiveLetterWords() {
  return prisma.word.findMany({
    where: { length: WORD_LENGTH },
    orderBy: { id: 'asc' },
  });
}

/**
 * Lazily creates the shared infinite pool for a Warsaw calendar date.
 * One pool per day for all players (up to {@link INFINITE_POOL_SIZE} unique words).
 * Safe to call concurrently — unique constraint on `(date, order)` handles races.
 */
export async function getOrCreateDailyPool(dateKey: string) {
  const date = dateKeyToUtcDate(dateKey);

  const existing = await prisma.dailyWordPool.findMany({
    where: { date },
    orderBy: { order: 'asc' },
    include: { word: true },
  });

  if (existing.length > 0) {
    return existing;
  }

  const words = await loadFiveLetterWords();
  if (words.length === 0) {
    throw new InfiniteError(503, 'Dictionary not loaded');
  }

  const poolSize = Math.min(INFINITE_POOL_SIZE, words.length);
  const selectedWordIds = new Set<number>();
  const entries: Array<{ date: Date; wordId: number; order: number }> = [];

  for (let order = 0; order < poolSize; order++) {
    let salt = 0;
    let wordId: number | undefined;

    while (salt <= words.length) {
      const index = pickPoolWordIndexForDate(dateKey, order + salt * poolSize, words.length);
      const candidate = words[index];
      if (!selectedWordIds.has(candidate.id)) {
        wordId = candidate.id;
        break;
      }
      salt++;
    }

    if (wordId === undefined) {
      throw new InfiniteError(503, 'Dictionary not loaded');
    }

    selectedWordIds.add(wordId);
    entries.push({ date, wordId, order });
  }

  try {
    await prisma.dailyWordPool.createMany({ data: entries });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
  }

  return prisma.dailyWordPool.findMany({
    where: { date },
    orderBy: { order: 'asc' },
    include: { word: true },
  });
}

async function getUsedOrders(
  userId: string,
  date: Date,
  cycleNumber: number,
  pool: PoolEntry[],
): Promise<Set<number>> {
  const usedEntries = await prisma.infiniteWordUsage.findMany({
    where: { userId, date, cycleNumber },
    select: { wordId: true },
  });
  const usedWordIds = new Set(usedEntries.map((entry) => entry.wordId));

  return new Set(pool.filter((entry) => usedWordIds.has(entry.wordId)).map((entry) => entry.order));
}

/** Picks the next word from the pool; bumps cycle when the current lap is exhausted. */
async function pickNextPoolEntry(
  userId: string,
  dateKey: string,
  pool: PoolEntry[],
  cycleNumber: number,
): Promise<{ entry: PoolEntry; cycleNumber: number }> {
  let activeCycle = cycleNumber;
  let usedOrders = await getUsedOrders(userId, dateKeyToUtcDate(dateKey), activeCycle, pool);
  let nextOrder = buildCyclePickOrder(
    pool.length,
    usedOrders,
    cycleSeed(userId, dateKey, activeCycle),
  );

  if (nextOrder === null) {
    activeCycle++;
    usedOrders = new Set();
    nextOrder = buildCyclePickOrder(
      pool.length,
      usedOrders,
      cycleSeed(userId, dateKey, activeCycle),
    );
  }

  if (nextOrder === null) {
    throw new InfiniteError(503, 'Dictionary not loaded');
  }

  const entry = pool.find((poolEntry) => poolEntry.order === nextOrder);
  if (!entry) {
    throw new InfiniteError(503, 'Dictionary not loaded');
  }

  return { entry, cycleNumber: activeCycle };
}

async function getOrCreatePlayerDay(userId: string, date: Date) {
  return prisma.infinitePlayerDay.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, cycleNumber: 0 },
    update: {},
  });
}

/**
 * Returns metadata for the player's current or next infinite word.
 * Does not expose the answer. Repeated calls while a word is in progress return
 * the same {@link InfiniteWordDto.wordNumber} (refresh-safe).
 */
export async function getNextWord(userId: string): Promise<InfiniteWordDto> {
  const dateKey = getCalendarDateKey();
  const date = dateKeyToUtcDate(dateKey);
  const pool = await getOrCreateDailyPool(dateKey);
  const playerDay = await getOrCreatePlayerDay(userId, date);

  const finishedCount = await prisma.infiniteWordUsage.count({
    where: { userId, date, cycleNumber: playerDay.cycleNumber },
  });

  if (playerDay.currentWordId !== null) {
    return buildInfiniteWordDto(dateKey, finishedCount + 1, pool.length);
  }

  const { entry, cycleNumber } = await pickNextPoolEntry(
    userId,
    dateKey,
    pool,
    playerDay.cycleNumber,
  );

  let wordNumber = finishedCount + 1;
  if (cycleNumber !== playerDay.cycleNumber) {
    const newFinishedCount = await prisma.infiniteWordUsage.count({
      where: { userId, date, cycleNumber },
    });
    wordNumber = newFinishedCount + 1;
  }

  await prisma.infinitePlayerDay.update({
    where: { userId_date: { userId, date } },
    data: {
      currentWordId: entry.wordId,
      cycleNumber,
      guessCount: 0,
    },
  });

  return buildInfiniteWordDto(dateKey, wordNumber, pool.length);
}

/**
 * Marks the in-progress word as finished for the current cycle.
 * Called by the guess handler after win or loss. Clears `currentWordId`
 * and advances `cycleNumber` when all pool words have been played today.
 */
export async function completeInfiniteWord(
  userId: string,
  options?: { guesses: number; won: boolean },
): Promise<void> {
  const dateKey = getCalendarDateKey();
  const date = dateKeyToUtcDate(dateKey);

  const playerDay = await prisma.infinitePlayerDay.findUnique({
    where: { userId_date: { userId, date } },
  });

  if (!playerDay?.currentWordId) {
    return;
  }

  const pool = await getOrCreateDailyPool(dateKey);

  await prisma.$transaction(async (tx) => {
    await tx.infiniteWordUsage.create({
      data: {
        userId,
        date,
        cycleNumber: playerDay.cycleNumber,
        wordId: playerDay.currentWordId!,
      },
    });

    const finishedCount = await tx.infiniteWordUsage.count({
      where: { userId, date, cycleNumber: playerDay.cycleNumber },
    });

    const nextCycleNumber =
      finishedCount >= pool.length ? playerDay.cycleNumber + 1 : playerDay.cycleNumber;

    await tx.infinitePlayerDay.update({
      where: { userId_date: { userId, date } },
      data: {
        currentWordId: null,
        cycleNumber: nextCycleNumber,
        guessCount: 0,
      },
    });

    if (options) {
      await tx.gameResult.create({
        data: {
          userId,
          mode: 'INFINITE',
          won: options.won,
          guesses: options.guesses,
        },
      });

      await tx.userStats.upsert({
        where: { userId },
        create: {
          userId,
          infinitePlayed: 1,
          infiniteWon: options.won ? 1 : 0,
        },
        update: {
          infinitePlayed: { increment: 1 },
          ...(options.won ? { infiniteWon: { increment: 1 } } : {}),
        },
      });
    }
  });
}

export async function submitInfiniteGuess(
  userId: string,
  rawGuess: string,
): Promise<GuessResultDto> {
  const guess = rawGuess.trim().toLowerCase();

  if (guess.length !== WORD_LENGTH) {
    throw new InfiniteError(400, `Guess must be ${WORD_LENGTH} letters`);
  }

  const dictionaryWord = await prisma.word.findUnique({
    where: { text: guess },
  });
  if (!dictionaryWord) {
    throw new InfiniteError(400, 'Not in dictionary');
  }

  const dateKey = getCalendarDateKey();
  const date = dateKeyToUtcDate(dateKey);
  const playerDay = await prisma.infinitePlayerDay.findUnique({
    where: { userId_date: { userId, date } },
    include: { word: true },
  });

  if (!playerDay?.currentWordId || !playerDay.word) {
    throw new InfiniteError(400, 'No word in progress');
  }

  if (playerDay.guessCount >= MAX_GUESSES) {
    throw new InfiniteError(400, 'Game already finished');
  }

  const answer = playerDay.word.text;
  const results = evaluateGuess(guess, answer);
  const won = results.every((result) => result === 'correct');
  const guessNumber = playerDay.guessCount + 1;
  const finished = won || guessNumber === MAX_GUESSES;

  if (finished) {
    await completeInfiniteWord(userId, { guesses: guessNumber, won });
  } else {
    await prisma.infinitePlayerDay.update({
      where: { userId_date: { userId, date } },
      data: { guessCount: guessNumber },
    });
  }

  return {
    results,
    won,
    finished,
    guessNumber,
    ...(finished ? { answer } : {}),
  };
}
