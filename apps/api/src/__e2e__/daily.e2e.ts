import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { getCalendarDateKey } from '../lib/daily-date.js';
import { resetDatabase, seedDictionaryWords } from '../test/helpers.js';
import { baseUrl } from './server.js';

describe('e2e: GET /daily/today', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('returns today challenge metadata over real http', async () => {
    await seedDictionaryWords(['jabłko', 'wążka', 'krzesło', 'mleko', 'stół']);

    const res = await request(baseUrl).get('/daily/today').expect(200);

    expect(res.body).toEqual({
      date: getCalendarDateKey(),
      maxGuesses: 6,
      wordLength: 5,
    });
    expect(res.body).not.toHaveProperty('answer');
  });
});
