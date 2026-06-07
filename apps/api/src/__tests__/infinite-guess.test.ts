import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_GUESSES } from '@wordlopol/shared';
import { signAccessToken } from '../lib/tokens.js';
import { prisma } from '../lib/prisma.js';
import { dateKeyToUtcDate, getCalendarDateKey } from '../lib/daily-date.js';
import {
  createTestAgent,
  createTestUser,
  createVerifiedUserWithPassword,
  pickWrongWord,
  resetDatabase,
  seedDictionaryWords,
} from '../test/helpers.js';

const TEST_POOL_WORDS = ['wążka', 'mleko', 'aabaa', 'aacaa', 'aadaa', 'aaeaa', 'aafaa', 'aagaa'];

async function getCurrentAnswer(userId: string): Promise<string> {
  const playerDay = await prisma.infinitePlayerDay.findUniqueOrThrow({
    where: {
      userId_date: {
        userId,
        date: dateKeyToUtcDate(getCalendarDateKey()),
      },
    },
    include: { word: true },
  });

  return playerDay.word!.text;
}

describe('POST /infinite/guess', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('returns 401 without authorization', async () => {
    const agent = await createTestAgent();
    const res = await agent.post('/infinite/guess').send({ guess: 'mleko' }).expect(401);

    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 for unverified users', async () => {
    const user = await createTestUser({ emailVerified: false });
    const token = signAccessToken(user.id);

    const agent = await createTestAgent();
    const res = await agent
      .post('/infinite/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ guess: 'mleko' })
      .expect(403);

    expect(res.body).toEqual({ error: 'Email not verified' });
  });

  it('returns 400 when no word is in progress', async () => {
    await seedDictionaryWords(TEST_POOL_WORDS);
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);

    const agent = await createTestAgent();
    const res = await agent
      .post('/infinite/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ guess: 'mleko' })
      .expect(400);

    expect(res.body).toEqual({ error: 'No word in progress' });
  });

  it('evaluates a guess without revealing the answer mid-game', async () => {
    await seedDictionaryWords(TEST_POOL_WORDS);
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);
    const answer = await (async () => {
      const agent = await createTestAgent();
      await agent.get('/infinite/next').set('Authorization', `Bearer ${token}`).expect(200);
      return getCurrentAnswer(user.id);
    })();
    const wrongGuess = pickWrongWord(TEST_POOL_WORDS, answer);

    const agent = await createTestAgent();
    const res = await agent
      .post('/infinite/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ guess: wrongGuess })
      .expect(200);

    expect(res.body.guessNumber).toBe(1);
    expect(res.body.won).toBe(false);
    expect(res.body.finished).toBe(false);
    expect(res.body.results).toHaveLength(5);
    expect(res.body).not.toHaveProperty('answer');
  });

  it('completes the word on a win and records stats', async () => {
    await seedDictionaryWords(TEST_POOL_WORDS);
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);

    const agent = await createTestAgent();
    await agent.get('/infinite/next').set('Authorization', `Bearer ${token}`).expect(200);
    const answer = await getCurrentAnswer(user.id);

    const res = await agent
      .post('/infinite/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ guess: answer })
      .expect(200);

    expect(res.body).toEqual({
      results: ['correct', 'correct', 'correct', 'correct', 'correct'],
      won: true,
      finished: true,
      guessNumber: 1,
      answer,
    });

    const gameResult = await prisma.gameResult.findFirstOrThrow({
      where: { userId: user.id, mode: 'INFINITE' },
    });
    expect(gameResult).toMatchObject({ won: true, guesses: 1 });

    const stats = await prisma.userStats.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(stats).toMatchObject({ infinitePlayed: 1, infiniteWon: 1 });

    const playerDay = await prisma.infinitePlayerDay.findUniqueOrThrow({
      where: {
        userId_date: {
          userId: user.id,
          date: dateKeyToUtcDate(getCalendarDateKey()),
        },
      },
    });
    expect(playerDay.currentWordId).toBeNull();
    expect(playerDay.guessCount).toBe(0);
  });

  it('allows fetching the next word after a win', async () => {
    await seedDictionaryWords(TEST_POOL_WORDS);
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);

    const agent = await createTestAgent();
    await agent.get('/infinite/next').set('Authorization', `Bearer ${token}`).expect(200);
    const answer = await getCurrentAnswer(user.id);

    await agent
      .post('/infinite/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ guess: answer })
      .expect(200);

    const next = await agent
      .get('/infinite/next')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(next.body.wordNumber).toBe(2);
  });

  it('records a loss after the sixth guess', async () => {
    await seedDictionaryWords(TEST_POOL_WORDS);
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);

    const agent = await createTestAgent();
    await agent.get('/infinite/next').set('Authorization', `Bearer ${token}`).expect(200);
    const answer = await getCurrentAnswer(user.id);
    const wrongGuesses = TEST_POOL_WORDS.filter((word) => word !== answer).slice(0, MAX_GUESSES);

    for (let i = 0; i < wrongGuesses.length; i++) {
      const res = await agent
        .post('/infinite/guess')
        .set('Authorization', `Bearer ${token}`)
        .send({ guess: wrongGuesses[i] })
        .expect(200);

      const isLast = i === wrongGuesses.length - 1;
      expect(res.body.guessNumber).toBe(i + 1);
      expect(res.body.finished).toBe(isLast);
      if (isLast) {
        expect(res.body.answer).toBe(answer);
      } else {
        expect(res.body).not.toHaveProperty('answer');
      }
    }

    const gameResult = await prisma.gameResult.findFirstOrThrow({
      where: { userId: user.id, mode: 'INFINITE' },
    });
    expect(gameResult).toMatchObject({ won: false, guesses: MAX_GUESSES });
  });

  it('rejects guesses that are not in the dictionary', async () => {
    await seedDictionaryWords(TEST_POOL_WORDS);
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);

    const agent = await createTestAgent();
    await agent.get('/infinite/next').set('Authorization', `Bearer ${token}`).expect(200);

    const res = await agent
      .post('/infinite/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ guess: 'zzzzz' })
      .expect(400);

    expect(res.body).toEqual({ error: 'Not in dictionary' });
  });
});
