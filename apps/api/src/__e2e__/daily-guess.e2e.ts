import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { getOrCreateDailyChallenge } from '../services/daily.js';
import { getCalendarDateKey } from '../lib/daily-date.js';
import { resetDatabase, pickWrongWord, seedDictionaryWords } from '../test/helpers.js';
import { baseUrl } from './server.js';

const TEST_WORDS = ['wążka', 'mleko', 'aabaa', 'aacaa', 'aadaa'];

async function getTodayAnswer(): Promise<string> {
  const challenge = await getOrCreateDailyChallenge(getCalendarDateKey());
  return challenge.word.text;
}

describe('e2e: POST /daily/guess', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('evaluates a guest guess over real http', async () => {
    await seedDictionaryWords(TEST_WORDS);
    const answer = await getTodayAnswer();
    const wrongGuess = pickWrongWord(TEST_WORDS, answer);

    const midGame = await request(baseUrl)
      .post('/daily/guess')
      .send({ guess: wrongGuess, guessNumber: 1 })
      .expect(200);

    expect(midGame.body.finished).toBe(false);
    expect(midGame.body).not.toHaveProperty('answer');

    const win = await request(baseUrl)
      .post('/daily/guess')
      .send({ guess: answer, guessNumber: 2 })
      .expect(200);

    expect(win.body).toMatchObject({
      won: true,
      finished: true,
      guessNumber: 2,
      answer,
    });
  });
});
