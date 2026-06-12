import { WORD_LENGTH, evaluateGuess } from '@wordlopol/shared';

import { HttpError } from './http-error.js';

export function normalizeGuessLength(rawGuess: string): string {
  const guess = rawGuess.trim().toLowerCase();

  if (guess.length !== WORD_LENGTH) {
    throw new HttpError(400, 'GUESS_WRONG_LENGTH', `Guess must be ${WORD_LENGTH} letters`);
  }

  return guess;
}

export async function assertGuessInDictionary(
  guess: string,
  isInDictionary: (word: string) => Promise<boolean>,
): Promise<void> {
  if (!(await isInDictionary(guess))) {
    throw new HttpError(400, 'NOT_IN_DICTIONARY');
  }
}

export function scoreGuess(guess: string, answer: string) {
  const results = evaluateGuess(guess, answer);
  const won = results.every((result) => result === 'correct');
  return { results, won };
}
