import { MAX_GUESSES } from '@wordlopol/shared';

import type { GameBoardRow } from '@/components/game/GameBoard';
import type { KeyState } from '@/components/game/PolishKeyboard';

const keyStateRank: Record<KeyState, number> = {
  unused: 0,
  absent: 1,
  present: 2,
  correct: 3,
};

export function createEmptyRows(): GameBoardRow[] {
  return Array.from({ length: MAX_GUESSES }, () => ({ letters: '' }));
}

export function buildKeyStates(rows: GameBoardRow[]): Partial<Record<string, KeyState>> {
  const states: Partial<Record<string, KeyState>> = {};

  for (const row of rows) {
    if (!row.results) continue;

    for (let index = 0; index < row.letters.length; index++) {
      const letter = row.letters[index]?.toUpperCase();
      const result = row.results[index];
      if (!letter || !result) continue;

      const previous = states[letter] ?? 'unused';
      if (keyStateRank[result] > keyStateRank[previous]) {
        states[letter] = result;
      }
    }
  }

  return states;
}

export function isGameWon(rows: GameBoardRow[]): boolean {
  return rows.some((row) => row.results?.every((result) => result === 'correct'));
}

export function isGameFinished(rows: GameBoardRow[], activeRowIndex: number): boolean {
  if (isGameWon(rows)) return true;
  return activeRowIndex >= MAX_GUESSES;
}
