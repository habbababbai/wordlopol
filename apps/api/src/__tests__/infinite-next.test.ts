import { beforeEach, describe, expect, it } from 'vitest';
import { WORD_LENGTH } from '@wordlopol/shared';
import { signAccessToken } from '../lib/tokens.js';
import { prisma } from '../lib/prisma.js';
import { dateKeyToUtcDate, getCalendarDateKey } from '../lib/daily-date.js';
import { completeInfiniteWord, getNextWord, getOrCreateDailyPool } from '../services/infinite.js';
import {
  createTestAgent,
  createTestUser,
  createVerifiedUserWithPassword,
  resetDatabase,
  seedDictionaryWords,
} from '../test/helpers.js';

const TEST_POOL_WORDS = ['wążka', 'mleko', 'aabaa', 'aacaa', 'aadaa'];

describe('GET /infinite/next', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('returns 401 without authorization', async () => {
    const agent = await createTestAgent();
    const res = await agent.get('/infinite/next').expect(401);

    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 for unverified users', async () => {
    const user = await createTestUser({ emailVerified: false });
    const token = signAccessToken(user.id);

    const agent = await createTestAgent();
    const res = await agent
      .get('/infinite/next')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(res.body).toEqual({ error: 'Email not verified' });
  });

  it('returns infinite metadata without the answer', async () => {
    await seedDictionaryWords(TEST_POOL_WORDS);
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);

    const agent = await createTestAgent();
    const res = await agent
      .get('/infinite/next')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual({
      date: getCalendarDateKey(),
      wordNumber: 1,
      poolSize: 5,
      maxGuesses: 6,
      wordLength: WORD_LENGTH,
    });
    expect(res.body).not.toHaveProperty('answer');
  });

  it('returns the same in-progress word on repeated requests', async () => {
    await seedDictionaryWords(TEST_POOL_WORDS);
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);

    const agent = await createTestAgent();
    const first = await agent
      .get('/infinite/next')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const second = await agent
      .get('/infinite/next')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(second.body).toEqual(first.body);

    const playerDay = await prisma.infinitePlayerDay.findUniqueOrThrow({
      where: {
        userId_date: {
          userId: user.id,
          date: dateKeyToUtcDate(getCalendarDateKey()),
        },
      },
    });
    expect(playerDay.currentWordId).not.toBeNull();
  });

  it('returns 503 when the dictionary is empty', async () => {
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);

    const agent = await createTestAgent();
    const res = await agent
      .get('/infinite/next')
      .set('Authorization', `Bearer ${token}`)
      .expect(503);

    expect(res.body).toEqual({ error: 'Dictionary not loaded' });
  });
});

describe('infinite word progression', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  async function getCurrentWordId(userId: string): Promise<number | null> {
    const playerDay = await prisma.infinitePlayerDay.findUnique({
      where: {
        userId_date: {
          userId,
          date: dateKeyToUtcDate(getCalendarDateKey()),
        },
      },
    });
    return playerDay?.currentWordId ?? null;
  }

  it('does not serve duplicate words within the same cycle', async () => {
    await seedDictionaryWords(TEST_POOL_WORDS);
    const { user } = await createVerifiedUserWithPassword();

    const seenWordIds = new Set<number>();

    for (let index = 0; index < 5; index++) {
      await getNextWord(user.id);
      const currentWordId = await getCurrentWordId(user.id);
      expect(currentWordId).not.toBeNull();
      seenWordIds.add(currentWordId!);
      await completeInfiniteWord(user.id);
    }

    expect(seenWordIds.size).toBe(5);
  });

  it('reuses the shared pool and advances cycle instead of creating new pool rows', async () => {
    await seedDictionaryWords(TEST_POOL_WORDS);
    const { user } = await createVerifiedUserWithPassword();
    const date = dateKeyToUtcDate(getCalendarDateKey());

    for (let index = 0; index < 5; index++) {
      await getNextWord(user.id);
      await completeInfiniteWord(user.id);
    }

    const poolCount = await prisma.dailyWordPool.count({ where: { date } });
    expect(poolCount).toBe(5);

    const playerDay = await prisma.infinitePlayerDay.findUniqueOrThrow({
      where: { userId_date: { userId: user.id, date } },
    });
    expect(playerDay.cycleNumber).toBe(1);
    expect(playerDay.currentWordId).toBeNull();
  });

  it('serves words in a different order on the next cycle', async () => {
    await seedDictionaryWords(TEST_POOL_WORDS);
    const { user } = await createVerifiedUserWithPassword();

    const cycle0: number[] = [];
    for (let index = 0; index < 5; index++) {
      await getNextWord(user.id);
      cycle0.push((await getCurrentWordId(user.id))!);
      await completeInfiniteWord(user.id);
    }

    const cycle1: number[] = [];
    for (let index = 0; index < 5; index++) {
      await getNextWord(user.id);
      cycle1.push((await getCurrentWordId(user.id))!);
      await completeInfiniteWord(user.id);
    }

    expect(new Set(cycle0).size).toBe(5);
    expect(new Set(cycle1).size).toBe(5);
    expect(cycle1).not.toEqual(cycle0);
  });

  it('returns wordNumber 1 when the next pick starts a new cycle', async () => {
    await seedDictionaryWords(TEST_POOL_WORDS);
    const { user } = await createVerifiedUserWithPassword();
    const dateKey = getCalendarDateKey();
    const date = dateKeyToUtcDate(dateKey);
    const pool = await getOrCreateDailyPool(dateKey);

    for (const entry of pool) {
      await prisma.infiniteWordUsage.create({
        data: {
          userId: user.id,
          date,
          cycleNumber: 0,
          wordId: entry.wordId,
        },
      });
    }

    await prisma.infinitePlayerDay.create({
      data: {
        userId: user.id,
        date,
        cycleNumber: 0,
        currentWordId: null,
      },
    });

    const next = await getNextWord(user.id);

    expect(next.wordNumber).toBe(1);
  });
});
