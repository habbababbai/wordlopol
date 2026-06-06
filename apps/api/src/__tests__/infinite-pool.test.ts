import { beforeEach, describe, expect, it } from 'vitest';
import { INFINITE_POOL_SIZE, WORD_LENGTH } from '@wordlopol/shared';
import { prisma } from '../lib/prisma.js';
import { dateKeyToUtcDate } from '../lib/daily-date.js';
import { getOrCreateDailyPool } from '../services/infinite.js';
import { resetDatabase, seedDictionaryWords } from '../test/helpers.js';

describe('getOrCreateDailyPool', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('creates a shared pool with up to INFINITE_POOL_SIZE unique five-letter words', async () => {
    const words = Array.from({ length: 20 }, (_, index) => `a${String(index).padStart(4, '0')}`);
    await seedDictionaryWords(words);

    const dateKey = '2026-06-06';
    const pool = await getOrCreateDailyPool(dateKey);

    expect(pool).toHaveLength(20);
    expect(new Set(pool.map((entry) => entry.wordId)).size).toBe(20);
    expect(pool.every((entry) => entry.word.length === WORD_LENGTH)).toBe(true);
    expect(pool.map((entry) => entry.order)).toEqual(Array.from({ length: 20 }, (_, i) => i));
  });

  it('is idempotent for the same calendar date', async () => {
    await seedDictionaryWords(['wążka', 'mleko', 'aabaa', 'aacaa', 'aadaa']);

    const dateKey = '2026-06-07';
    const first = await getOrCreateDailyPool(dateKey);
    const second = await getOrCreateDailyPool(dateKey);

    expect(second.map((entry) => entry.wordId)).toEqual(first.map((entry) => entry.wordId));

    const poolCount = await prisma.dailyWordPool.count({
      where: { date: dateKeyToUtcDate(dateKey) },
    });
    expect(poolCount).toBe(first.length);
  });

  it('creates at most INFINITE_POOL_SIZE entries when dictionary is larger', async () => {
    const words = Array.from(
      { length: INFINITE_POOL_SIZE + 10 },
      (_, index) => `a${String(index).padStart(4, '0')}`,
    );
    await seedDictionaryWords(words);

    const pool = await getOrCreateDailyPool('2026-06-08');

    expect(pool).toHaveLength(INFINITE_POOL_SIZE);
    expect(new Set(pool.map((entry) => entry.wordId)).size).toBe(INFINITE_POOL_SIZE);
  });

  it('throws 503 when the dictionary is empty', async () => {
    await expect(getOrCreateDailyPool('2026-06-09')).rejects.toMatchObject({
      statusCode: 503,
      message: 'Dictionary not loaded',
    });
  });

  it('throws 503 when no five-letter words exist', async () => {
    await prisma.word.createMany({
      data: [{ text: 'wąż', length: 3 }],
    });

    await expect(getOrCreateDailyPool('2026-06-10')).rejects.toMatchObject({
      statusCode: 503,
      message: 'Dictionary not loaded',
    });
  });
});
