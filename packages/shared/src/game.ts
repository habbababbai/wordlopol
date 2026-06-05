import type { LetterResult } from './types.js';
import { WORD_LENGTH } from './types.js';

export function evaluateGuess(guess: string, answer: string): LetterResult[] {
  const normalizedGuess = guess.toLowerCase();
  const normalizedAnswer = answer.toLowerCase();

  if (normalizedGuess.length !== WORD_LENGTH || normalizedAnswer.length !== WORD_LENGTH) {
    throw new Error(`Guess and answer must be ${WORD_LENGTH} letters`);
  }

  const results: LetterResult[] = Array(WORD_LENGTH).fill('absent');
  const answerChars = normalizedAnswer.split('');
  const unmatchedAnswerIndices = new Set<number>();

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (normalizedGuess[i] === answerChars[i]) {
      results[i] = 'correct';
    } else {
      unmatchedAnswerIndices.add(i);
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (results[i] === 'correct') continue;

    const guessChar = normalizedGuess[i];
    let found = false;

    for (const j of unmatchedAnswerIndices) {
      if (answerChars[j] === guessChar) {
        results[i] = 'present';
        unmatchedAnswerIndices.delete(j);
        found = true;
        break;
      }
    }

    if (!found) {
      results[i] = 'absent';
    }
  }

  return results;
}

export function isValidWord(word: string, dictionary: Set<string> | string[]): boolean {
  const normalized = word.toLowerCase();
  if (normalized.length !== WORD_LENGTH) return false;

  if (dictionary instanceof Set) {
    return dictionary.has(normalized);
  }

  return dictionary.includes(normalized);
}
