import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { WORD_LENGTH } from '@wordlopol/shared';
import { signAccessToken } from '@/lib/tokens.js';
import { getCalendarDateKey } from '@/lib/daily-date.js';
import {
  apiPath,
  createVerifiedUserWithPassword,
  resetDatabase,
  seedDictionaryWords,
} from '@/test/helpers.js';
import { baseUrl } from './server.js';

describe('e2e: GET /infinite/next', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('returns infinite metadata over real http for a verified user', async () => {
    await seedDictionaryWords(['wążka', 'mleko', 'aabaa', 'aacaa', 'aadaa']);
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id, true);

    const res = await request(baseUrl)
      .get(apiPath('/infinite/next'))
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
});
