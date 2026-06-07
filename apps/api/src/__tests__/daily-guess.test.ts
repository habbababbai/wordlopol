import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_GUESSES } from '@wordlopol/shared';
import { signAccessToken } from '../lib/tokens.js';
import { prisma } from '../lib/prisma.js';
import { dateKeyToUtcDate, getCalendarDateKey } from '../lib/daily-date.js';
import { getOrCreateDailyChallenge } from '../services/daily.js';
import {
  createTestAgent,
  createVerifiedUserWithPassword,
  resetDatabase,
  seedDictionaryWords,
} from '../test/helpers.js';

const TEST_WORDS = ['wążka', 'mleko', 'aabaa', 'aacaa', 'aadaa', 'aaeaa', 'aafaa', 'aagaa'];

async function getTodayAnswer(): Promise<string> {
  const dateKey = getCalendarDateKey();
  const challenge = await getOrCreateDailyChallenge(dateKey);
  return challenge.word.text;
}

describe('POST /daily/guess', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('evaluates a guest guess without revealing the answer mid-game', async () => {
    await seedDictionaryWords(TEST_WORDS);
    const answer = await getTodayAnswer();
    const wrongGuess = TEST_WORDS.find((word) => word !== answer)!;

    const agent = await createTestAgent();
    const res = await agent
      .post('/daily/guess')
      .send({ guess: wrongGuess, guessNumber: 1 })
      .expect(200);

    expect(res.body.guessNumber).toBe(1);
    expect(res.body.won).toBe(false);
    expect(res.body.finished).toBe(false);
    expect(res.body.results).toHaveLength(5);
    expect(res.body).not.toHaveProperty('answer');
  });

  it('returns the answer for a guest when the game finishes', async () => {
    await seedDictionaryWords(TEST_WORDS);
    const answer = await getTodayAnswer();

    const agent = await createTestAgent();
    const res = await agent
      .post('/daily/guess')
      .send({ guess: answer, guessNumber: 1 })
      .expect(200);

    expect(res.body).toEqual({
      results: ['correct', 'correct', 'correct', 'correct', 'correct'],
      won: true,
      finished: true,
      guessNumber: 1,
      answer,
    });
  });

  it('requires guessNumber for guest play', async () => {
    await seedDictionaryWords(TEST_WORDS);

    const agent = await createTestAgent();
    const res = await agent.post('/daily/guess').send({ guess: 'mleko' }).expect(400);

    expect(res.body).toEqual({ error: 'guessNumber is required for guest play' });
  });

  it('rejects guesses that are not in the dictionary', async () => {
    await seedDictionaryWords(TEST_WORDS);

    const agent = await createTestAgent();
    const res = await agent
      .post('/daily/guess')
      .send({ guess: 'zzzzz', guessNumber: 1 })
      .expect(400);

    expect(res.body).toEqual({ error: 'Not in dictionary' });
  });

  it('rejects guesses with the wrong length', async () => {
    await seedDictionaryWords(TEST_WORDS);

    const agent = await createTestAgent();
    const res = await agent.post('/daily/guess').send({ guess: 'ab', guessNumber: 1 }).expect(400);

    expect(res.body).toEqual({ error: 'Guess must be 5 letters' });
  });

  it('tracks guess count server-side for authenticated users', async () => {
    await seedDictionaryWords(TEST_WORDS);
    const answer = await getTodayAnswer();
    const wrongGuess = TEST_WORDS.find((word) => word !== answer)!;
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);

    const agent = await createTestAgent();

    const first = await agent
      .post('/daily/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ guess: wrongGuess })
      .expect(200);

    expect(first.body.guessNumber).toBe(1);
    expect(first.body.finished).toBe(false);

    const second = await agent
      .post('/daily/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ guess: answer })
      .expect(200);

    expect(second.body.guessNumber).toBe(2);
    expect(second.body.won).toBe(true);
    expect(second.body.finished).toBe(true);
    expect(second.body.answer).toBe(answer);
  });

  it('persists GameResult and UserStats when a registered user finishes', async () => {
    await seedDictionaryWords(TEST_WORDS);
    const answer = await getTodayAnswer();
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);
    const dateKey = getCalendarDateKey();

    const agent = await createTestAgent();
    await agent
      .post('/daily/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ guess: answer })
      .expect(200);

    const challenge = await prisma.dailyChallenge.findUniqueOrThrow({
      where: { date: dateKeyToUtcDate(dateKey) },
    });

    const gameResult = await prisma.gameResult.findFirstOrThrow({
      where: { userId: user.id, mode: 'DAILY' },
    });
    expect(gameResult).toMatchObject({
      userId: user.id,
      mode: 'DAILY',
      won: true,
      guesses: 1,
      dailyChallengeId: challenge.id,
    });

    const stats = await prisma.userStats.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(stats).toMatchObject({
      dailyPlayed: 1,
      dailyWon: 1,
    });
  });

  it('returns 409 when a registered user already completed today', async () => {
    await seedDictionaryWords(TEST_WORDS);
    const answer = await getTodayAnswer();
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);

    const agent = await createTestAgent();
    await agent
      .post('/daily/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ guess: answer })
      .expect(200);

    const res = await agent
      .post('/daily/guess')
      .set('Authorization', `Bearer ${token}`)
      .send({ guess: answer })
      .expect(409);

    expect(res.body).toEqual({ error: 'Already played today' });
  });

  it('records a loss after the sixth guess for registered users', async () => {
    await seedDictionaryWords(TEST_WORDS);
    const answer = await getTodayAnswer();
    const wrongGuesses = TEST_WORDS.filter((word) => word !== answer).slice(0, MAX_GUESSES);
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);

    const agent = await createTestAgent();

    for (let i = 0; i < wrongGuesses.length; i++) {
      const res = await agent
        .post('/daily/guess')
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
      where: { userId: user.id, mode: 'DAILY' },
    });
    expect(gameResult).toMatchObject({ won: false, guesses: MAX_GUESSES });

    const stats = await prisma.userStats.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(stats).toMatchObject({ dailyPlayed: 1, dailyWon: 0 });
  });
});
