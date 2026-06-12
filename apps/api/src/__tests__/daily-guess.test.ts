import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_GUESSES } from '@wordlopol/shared';
import { signAccessToken } from '@/lib/tokens.js';
import { prisma } from '@/lib/prisma.js';
import { GUEST_DAILY_SESSION_COOKIE } from '@/lib/guest-daily-session.js';
import { dateKeyToUtcDate, getCalendarDateKey } from '@/lib/daily-date.js';
import { getOrCreateDailyChallenge } from '@/services/daily.js';
import { expectApiError } from './helpers/expect-api-error.js';
import {
  apiPath,
  createTestAgent,
  createVerifiedUserWithPassword,
  pickWrongWord,
  resetDatabase,
  seedDictionaryWords,
  startGuestDailySession,
} from '@/test/helpers.js';

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
    const wrongGuess = pickWrongWord(TEST_WORDS, answer);

    const agent = await createTestAgent();
    await startGuestDailySession(agent);

    const res = await agent.post(apiPath('/daily/guess')).send({ guess: wrongGuess }).expect(200);

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
    await startGuestDailySession(agent);

    const res = await agent.post(apiPath('/daily/guess')).send({ guess: answer }).expect(200);

    expect(res.body).toEqual({
      results: ['correct', 'correct', 'correct', 'correct', 'correct'],
      won: true,
      finished: true,
      guessNumber: 1,
      answer,
    });
  });

  it('requires a guest session cookie', async () => {
    await seedDictionaryWords(TEST_WORDS);

    const agent = await createTestAgent();
    const res = await agent.post(apiPath('/daily/guess')).send({ guess: 'mleko' }).expect(401);

    expect(res.body).toEqual(expectApiError('GUEST_SESSION_REQUIRED'));
  });

  it('tracks guest guess count server-side across requests', async () => {
    await seedDictionaryWords(TEST_WORDS);
    const answer = await getTodayAnswer();
    const wrongGuess = pickWrongWord(TEST_WORDS, answer);

    const agent = await createTestAgent();
    await startGuestDailySession(agent);

    const first = await agent.post(apiPath('/daily/guess')).send({ guess: wrongGuess }).expect(200);
    expect(first.body.guessNumber).toBe(1);

    const second = await agent.post(apiPath('/daily/guess')).send({ guess: answer }).expect(200);
    expect(second.body.guessNumber).toBe(2);
    expect(second.body.won).toBe(true);
  });

  it('rejects guesses that are not in the dictionary', async () => {
    await seedDictionaryWords(TEST_WORDS);

    const agent = await createTestAgent();
    await startGuestDailySession(agent);

    const res = await agent.post(apiPath('/daily/guess')).send({ guess: 'zzzzz' }).expect(400);

    expect(res.body).toEqual(expectApiError('NOT_IN_DICTIONARY'));
  });

  it('rejects guesses with the wrong length', async () => {
    await seedDictionaryWords(TEST_WORDS);

    const agent = await createTestAgent();
    await startGuestDailySession(agent);

    const res = await agent.post(apiPath('/daily/guess')).send({ guess: 'ab' }).expect(400);

    expect(res.body).toEqual(expectApiError('GUESS_WRONG_LENGTH'));
  });

  it('tracks guess count server-side for authenticated users', async () => {
    await seedDictionaryWords(TEST_WORDS);
    const answer = await getTodayAnswer();
    const wrongGuess = pickWrongWord(TEST_WORDS, answer);
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);

    const agent = await createTestAgent();

    const first = await agent
      .post(apiPath('/daily/guess'))
      .set('Authorization', `Bearer ${token}`)
      .send({ guess: wrongGuess })
      .expect(200);

    expect(first.body.guessNumber).toBe(1);
    expect(first.body.finished).toBe(false);

    const second = await agent
      .post(apiPath('/daily/guess'))
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
      .post(apiPath('/daily/guess'))
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
      .post(apiPath('/daily/guess'))
      .set('Authorization', `Bearer ${token}`)
      .send({ guess: answer })
      .expect(200);

    const res = await agent
      .post(apiPath('/daily/guess'))
      .set('Authorization', `Bearer ${token}`)
      .send({ guess: answer })
      .expect(409);

    expect(res.body).toEqual(expectApiError('ALREADY_PLAYED_TODAY'));
  });

  it('records a loss after the sixth guess for registered users', async () => {
    await seedDictionaryWords(TEST_WORDS);
    const answer = await getTodayAnswer();
    const wrongGuesses = TEST_WORDS.filter((word) => word !== answer).slice(0, MAX_GUESSES);
    expect(wrongGuesses.length).toBe(MAX_GUESSES);
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id);

    const agent = await createTestAgent();

    for (let i = 0; i < wrongGuesses.length; i++) {
      const res = await agent
        .post(apiPath('/daily/guess'))
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

describe('GET /daily/today guest session', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('sets a guest session cookie for unauthenticated requests', async () => {
    await seedDictionaryWords(TEST_WORDS);

    const agent = await createTestAgent();
    const res = await agent.get(apiPath('/daily/today')).expect(200);

    expect(res.headers['set-cookie']?.[0]).toContain(`${GUEST_DAILY_SESSION_COOKIE}=`);

    const sessionCount = await prisma.guestDailySession.count();
    expect(sessionCount).toBe(1);
  });

  it('deletes guest sessions from previous calendar days', async () => {
    await seedDictionaryWords(TEST_WORDS);

    const todayKey = getCalendarDateKey();
    const yesterdayKey = getCalendarDateKey(new Date(Date.now() - 86_400_000));

    await prisma.guestDailySession.createMany({
      data: [
        { date: dateKeyToUtcDate('2020-01-01'), guessCount: 2 },
        { date: dateKeyToUtcDate(yesterdayKey), guessCount: 1 },
      ],
    });

    const agent = await createTestAgent();
    await agent.get(apiPath('/daily/today')).expect(200);

    const remaining = await prisma.guestDailySession.findMany();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.date).toEqual(dateKeyToUtcDate(todayKey));
  });

  it('replaces a stale guest session cookie from a previous day', async () => {
    await seedDictionaryWords(TEST_WORDS);

    const yesterdayKey = getCalendarDateKey(new Date(Date.now() - 86_400_000));
    const staleSession = await prisma.guestDailySession.create({
      data: { date: dateKeyToUtcDate(yesterdayKey), guessCount: 3 },
    });

    const agent = await createTestAgent();
    await agent
      .get(apiPath('/daily/today'))
      .set('Cookie', `${GUEST_DAILY_SESSION_COOKIE}=${staleSession.id}`)
      .expect(200);

    expect(
      await prisma.guestDailySession.findUnique({ where: { id: staleSession.id } }),
    ).toBeNull();
    expect(await prisma.guestDailySession.count()).toBe(1);
  });
});
