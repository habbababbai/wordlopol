import { beforeEach, describe, expect, it } from 'vitest';
import { signAccessToken } from '../lib/tokens.js';
import { prisma } from '../lib/prisma.js';
import { createTestAgent, createVerifiedUserWithPassword, resetDatabase } from '../test/helpers.js';

describe('GET /user/profile', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('returns 401 without authorization', async () => {
    const agent = await createTestAgent();
    const res = await agent.get('/user/profile').expect(401);

    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('returns profile with zero stats for a user who has not played', async () => {
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);

    const agent = await createTestAgent();
    const res = await agent
      .get('/user/profile')
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

  it('returns persisted stats for a user who has played', async () => {
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);

    await prisma.userStats.create({
      data: {
        userId: user.id,
        dailyPlayed: 3,
        dailyWon: 2,
        infinitePlayed: 10,
        infiniteWon: 7,
      },
    });

    const agent = await createTestAgent();
    const res = await agent
      .get('/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      emailVerified: true,
      stats: {
        dailyPlayed: 3,
        dailyWon: 2,
        infinitePlayed: 10,
        infiniteWon: 7,
        bestTimedWords: null,
        bestTimedMs: null,
        bestTimedWord: null,
      },
    });
  });
});
