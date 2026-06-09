import { MAX_GUESSES } from '@wordlopol/shared';
import { describe, expect, it } from 'vitest';

import type { GameBoardRow } from '@/components/game/GameBoard';
import { buildKeyStates, createEmptyRows, isGameFinished, isGameWon } from '@/lib/game-board';

describe('createEmptyRows', () => {
  it('returns MAX_GUESSES empty rows', () => {
    const rows = createEmptyRows();

    expect(rows).toHaveLength(MAX_GUESSES);
    expect(rows.every((row) => row.letters === '' && row.results === undefined)).toBe(true);
  });
});

describe('buildKeyStates', () => {
  it('merges letter states using correct > present > absent', () => {
    const rows: GameBoardRow[] = [
      {
        letters: 'aaaaa',
        results: ['absent', 'absent', 'absent', 'absent', 'present'],
      },
      {
        letters: 'ebbbb',
        results: ['correct', 'absent', 'absent', 'absent', 'absent'],
      },
    ];

    expect(buildKeyStates(rows)).toEqual({
      A: 'present',
      E: 'correct',
      B: 'absent',
    });
  });

  it('promotes absent to correct when letter appears correct later', () => {
    const rows: GameBoardRow[] = [
      {
        letters: 'xxrxx',
        results: ['absent', 'absent', 'absent', 'absent', 'absent'],
      },
      {
        letters: 'rxxxx',
        results: ['correct', 'absent', 'absent', 'absent', 'absent'],
      },
    ];

    expect(buildKeyStates(rows)).toEqual({
      R: 'correct',
      X: 'absent',
    });
  });

  it('ignores rows without results', () => {
    const rows: GameBoardRow[] = [{ letters: 'mleko' }];

    expect(buildKeyStates(rows)).toEqual({});
  });
});

describe('isGameWon', () => {
  it('returns true when a row is fully correct', () => {
    const rows: GameBoardRow[] = [
      {
        letters: 'snieg',
        results: ['correct', 'correct', 'correct', 'correct', 'correct'],
      },
    ];

    expect(isGameWon(rows)).toBe(true);
  });

  it('returns false when no row is fully correct', () => {
    const rows: GameBoardRow[] = [
      {
        letters: 'mleko',
        results: ['absent', 'present', 'absent', 'absent', 'correct'],
      },
    ];

    expect(isGameWon(rows)).toBe(false);
  });
});

describe('isGameFinished', () => {
  it('returns true when game is won', () => {
    const rows: GameBoardRow[] = [
      {
        letters: 'snieg',
        results: ['correct', 'correct', 'correct', 'correct', 'correct'],
      },
    ];

    expect(isGameFinished(rows, 0)).toBe(true);
  });

  it('returns true when active row index reaches MAX_GUESSES', () => {
    expect(isGameFinished(createEmptyRows(), MAX_GUESSES)).toBe(true);
  });

  it('returns false for an in-progress game', () => {
    expect(isGameFinished(createEmptyRows(), 2)).toBe(false);
  });
});
