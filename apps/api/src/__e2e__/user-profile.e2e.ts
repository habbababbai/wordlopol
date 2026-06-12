import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { signAccessToken } from '@/lib/tokens.js';
import { apiPath, createVerifiedUserWithPassword, resetDatabase } from '@/test/helpers.js';
import { baseUrl } from './server.js';

describe('e2e: GET /user/profile', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('returns profile and zero stats over real http', async () => {
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);

    const res = await request(baseUrl)
      .get(apiPath('/user/profile'))
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      emailVerified: true,
      stats: {
        dailyPlayed: 0,
        dailyWon: 0,
        infinitePlayed: 0,
        infiniteWon: 0,
        bestTimedWords: null,
        bestTimedMs: null,
        bestTimedWord: null,
      },
    });
  });
});
