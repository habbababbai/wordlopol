import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { getCalendarDateKey } from '../lib/daily-date.js';
import { getOrCreateDailyChallenge } from '../services/daily.js';
import { createTestAgent, resetDatabase, seedDictionaryWords } from '../test/helpers.js';

describe('GET /daily/today', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('returns today challenge metadata without the answer', async () => {
    await seedDictionaryWords(['jabłko', 'wążka', 'krzesło', 'mleko', 'stół']);

    const agent = await createTestAgent();
    const res = await agent.get('/daily/today').expect(200);

    expect(res.body).toEqual({
      date: getCalendarDateKey(),
      maxGuesses: 6,
      wordLength: 5,
    });
    expect(res.body).not.toHaveProperty('answer');
  });

  it('is idempotent for the same calendar day', async () => {
    await seedDictionaryWords(['jabłko', 'wążka', 'krzesło', 'mleko', 'stół']);

    const agent = await createTestAgent();
    const first = await agent.get('/daily/today').expect(200);
    const second = await agent.get('/daily/today').expect(200);

    expect(second.body).toEqual(first.body);

    const challengeCount = await prisma.dailyChallenge.count();
    expect(challengeCount).toBe(1);
  });

  it('creates the same challenge when getOrCreateDailyChallenge is called twice', async () => {
    await seedDictionaryWords(['jabłko', 'wążka', 'krzesło', 'mleko', 'stół']);

    const dateKey = '2026-06-06';
    const first = await getOrCreateDailyChallenge(dateKey);
    const second = await getOrCreateDailyChallenge(dateKey);

    expect(second.wordId).toBe(first.wordId);

    const challengeCount = await prisma.dailyChallenge.count({
      where: { date: new Date(`${dateKey}T00:00:00.000Z`) },
    });
    expect(challengeCount).toBe(1);
  });

  it('returns 503 when the dictionary is empty', async () => {
    const agent = await createTestAgent();
    const res = await agent.get('/daily/today').expect(503);

    expect(res.body).toEqual({ error: 'Dictionary not loaded' });
  });
});
