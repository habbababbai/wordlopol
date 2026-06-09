import { beforeEach, describe, expect, it } from 'vitest';

import type { GameBoardRow } from '@/components/game/GameBoard';
import {
  clearDailyFinished,
  loadDailyFinished,
  resetDailyFinishedStore,
  saveDailyAlreadyPlayed,
  saveDailyFinished,
  useDailyFinishedStore,
} from '@/stores/daily-finished-store';

const STORAGE_KEY = 'wordlopol-daily-finished';

describe('daily-finished-store', () => {
  beforeEach(() => {
    resetDailyFinishedStore();
  });

  it('returns null when nothing is stored', () => {
    expect(loadDailyFinished('2026-06-09')).toBeNull();
  });

  it('loads completed entry when date matches', () => {
    const rows: GameBoardRow[] = [
      {
        letters: 'snieg',
        results: ['correct', 'correct', 'correct', 'correct', 'correct'],
      },
    ];
    const entry = {
      date: '2026-06-09',
      status: 'completed' as const,
      rows,
      won: true,
      answer: 'snieg',
    };

    saveDailyFinished(entry);

    expect(loadDailyFinished('2026-06-09')).toEqual(entry);
  });

  it('returns null when stored date does not match', () => {
    saveDailyAlreadyPlayed('2026-06-08');

    expect(loadDailyFinished('2026-06-09')).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('loads alreadyPlayed entry when date matches', () => {
    saveDailyAlreadyPlayed('2026-06-09');

    expect(loadDailyFinished('2026-06-09')).toEqual({
      date: '2026-06-09',
      status: 'alreadyPlayed',
    });
  });

  it('clears entry only for matching date', () => {
    saveDailyAlreadyPlayed('2026-06-09');

    clearDailyFinished('2026-06-08');
    expect(loadDailyFinished('2026-06-09')).not.toBeNull();

    clearDailyFinished('2026-06-09');
    expect(loadDailyFinished('2026-06-09')).toBeNull();
  });

  it('persists entry to localStorage via zustand persist', () => {
    saveDailyAlreadyPlayed('2026-06-09');

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? '')).toMatchObject({
      state: { entry: { date: '2026-06-09', status: 'alreadyPlayed' } },
    });
  });

  it('returns null for invalid persisted JSON after rehydrate', async () => {
    localStorage.setItem(STORAGE_KEY, '{not-json');
    resetDailyFinishedStore();
    localStorage.setItem(STORAGE_KEY, '{not-json');

    await useDailyFinishedStore.persist.rehydrate();

    expect(loadDailyFinished('2026-06-09')).toBeNull();
  });

  it('returns null for invalid persisted shape after rehydrate', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { entry: { date: '2026-06-09', status: 'unknown' } },
        version: 0,
      }),
    );

    await useDailyFinishedStore.persist.rehydrate();

    expect(loadDailyFinished('2026-06-09')).toBeNull();
    expect(useDailyFinishedStore.getState().entry).toBeNull();
  });
});
