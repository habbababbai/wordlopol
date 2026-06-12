import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { signAccessToken } from '@/lib/tokens.js';
import { prisma } from '@/lib/prisma.js';
import { dateKeyToUtcDate, getCalendarDateKey } from '@/lib/daily-date.js';
import {
  apiPath,
  createVerifiedUserWithPassword,
  pickWrongWord,
  resetDatabase,
  seedDictionaryWords,
} from '@/test/helpers.js';
import { baseUrl } from './server.js';

const TEST_POOL_WORDS = ['wążka', 'mleko', 'aabaa', 'aacaa', 'aadaa'];

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

describe('e2e: POST /infinite/guess', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('evaluates a guess and advances to the next word over real http', async () => {
    await seedDictionaryWords(TEST_POOL_WORDS);
    const { user } = await createVerifiedUserWithPassword();
    const token = signAccessToken(user.id, true);

    await request(baseUrl)
      .get(apiPath('/infinite/next'))
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const answer = await getCurrentAnswer(user.id);
    const wrongGuess = pickWrongWord(TEST_POOL_WORDS, answer);

    const midGame = await request(baseUrl)
      .post(apiPath('/infinite/guess'))
      .set('Authorization', `Bearer ${token}`)
      .send({ guess: wrongGuess })
      .expect(200);

    expect(midGame.body.finished).toBe(false);
    expect(midGame.body).not.toHaveProperty('answer');

    const win = await request(baseUrl)
      .post(apiPath('/infinite/guess'))
      .set('Authorization', `Bearer ${token}`)
      .send({ guess: answer })
      .expect(200);

    expect(win.body).toMatchObject({
      won: true,
      finished: true,
      guessNumber: 2,
      answer,
    });

    const next = await request(baseUrl)
      .get(apiPath('/infinite/next'))
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(next.body.wordNumber).toBe(2);
  });
});
