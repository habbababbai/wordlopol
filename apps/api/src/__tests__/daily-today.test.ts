import { beforeEach, describe, expect, it } from 'vitest';
import { WORD_LENGTH } from '@wordlopol/shared';
import { prisma } from '../lib/prisma.js';
import { dateKeyToUtcDate, getCalendarDateKey } from '../lib/daily-date.js';
import { getOrCreateDailyChallenge } from '../services/daily.js';
import { expectApiError } from './helpers/expect-api-error.js';
import { apiPath, createTestAgent, resetDatabase, seedDictionaryWords } from '../test/helpers.js';

describe('GET /daily/today', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('returns today challenge metadata without the answer', async () => {
    await seedDictionaryWords(['jabłko', 'wążka', 'krzesło', 'mleko', 'stół']);

    const agent = await createTestAgent();
    const dateKey = getCalendarDateKey();
    const res = await agent.get(apiPath('/daily/today')).expect(200);

    expect(res.body).toEqual({
      date: dateKey,
      maxGuesses: 6,
      wordLength: WORD_LENGTH,
    });
    expect(res.body).not.toHaveProperty('answer');

    const challenge = await prisma.dailyChallenge.findUniqueOrThrow({
      where: { date: dateKeyToUtcDate(dateKey) },
      include: { word: true },
    });
    expect(challenge.word.length).toBe(res.body.wordLength);
  });

  it('is idempotent for the same calendar day', async () => {
    await seedDictionaryWords(['jabłko', 'wążka', 'krzesło', 'mleko', 'stół']);

    const agent = await createTestAgent();
    const first = await agent.get(apiPath('/daily/today')).expect(200);
    const second = await agent.get(apiPath('/daily/today')).expect(200);

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
    expect(first.word.length).toBe(WORD_LENGTH);

    const challengeCount = await prisma.dailyChallenge.count({
      where: { date: dateKeyToUtcDate(dateKey) },
    });
    expect(challengeCount).toBe(1);
  });

  it('selects only five-letter words when dictionary has mixed lengths', async () => {
    await prisma.word.createMany({
      data: [
        { text: 'wąż', length: 3 },
        { text: 'jabłko', length: 6 },
        { text: 'krzesło', length: 7 },
        { text: 'stół', length: 4 },
        { text: 'mleko', length: 5 },
      ],
    });

    const challenge = await getOrCreateDailyChallenge('2026-06-07');
    expect(challenge.word.length).toBe(WORD_LENGTH);
  });

  it('returns 503 when the dictionary is empty', async () => {
    const agent = await createTestAgent();
    const res = await agent.get(apiPath('/daily/today')).expect(503);

    expect(res.body).toEqual(expectApiError('DICTIONARY_NOT_LOADED'));
  });

  it('returns 503 when no five-letter words exist', async () => {
    await prisma.word.createMany({
      data: [{ text: 'wąż', length: 3 }],
    });

    const agent = await createTestAgent();
    const res = await agent.get(apiPath('/daily/today')).expect(503);

    expect(res.body).toEqual(expectApiError('DICTIONARY_NOT_LOADED'));
  });
});
