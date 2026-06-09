import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { GameBoardRow } from '@/components/game/GameBoard';

const VALID_RESULTS = new Set<string>(['absent', 'present', 'correct']);

export type DailyFinishedCompletedCache = {
  date: string;
  status: 'completed';
  rows: GameBoardRow[];
  won: boolean;
  answer: string;
};

export type DailyFinishedAlreadyPlayedCache = {
  date: string;
  status: 'alreadyPlayed';
};

export type DailyFinishedCache = DailyFinishedCompletedCache | DailyFinishedAlreadyPlayedCache;

function isDailyFinishedCache(value: unknown): value is DailyFinishedCache {
  if (!value || typeof value !== 'object') return false;

  const record = value as Record<string, unknown>;
  if (typeof record.date !== 'string') return false;

  if (record.status === 'alreadyPlayed') {
    return true;
  }

  if (record.status !== 'completed') return false;
  if (!Array.isArray(record.rows)) return false;
  if (typeof record.won !== 'boolean') return false;
  if (typeof record.answer !== 'string') return false;

  return record.rows.every((row) => {
    if (!row || typeof row !== 'object') return false;

    const gameRow = row as GameBoardRow;
    if (typeof gameRow.letters !== 'string') return false;
    if (gameRow.results === undefined) return true;

    return (
      Array.isArray(gameRow.results) &&
      gameRow.results.length === gameRow.letters.length &&
      gameRow.results.every((result) => typeof result === 'string' && VALID_RESULTS.has(result))
    );
  });
}

type DailyFinishedStore = {
  entry: DailyFinishedCache | null;
  getForDate: (date: string) => DailyFinishedCache | null;
  setFinished: (entry: DailyFinishedCache) => void;
  setAlreadyPlayed: (date: string) => void;
  clearForDate: (date: string) => void;
};

export const useDailyFinishedStore = create<DailyFinishedStore>()(
  persist(
    (set, get) => ({
      entry: null,
      getForDate: (date) => {
        const entry = get().entry;
        if (!entry || !isDailyFinishedCache(entry) || entry.date !== date) {
          return null;
        }
        return entry;
      },
      setFinished: (entry) => {
        if (!isDailyFinishedCache(entry)) return;
        set({ entry });
      },
      setAlreadyPlayed: (date) => set({ entry: { date, status: 'alreadyPlayed' } }),
      clearForDate: (date) => {
        if (get().entry?.date === date) {
          set({ entry: null });
        }
      },
    }),
    {
      name: 'wordlopol-daily-finished',
      partialize: (state) => ({ entry: state.entry }),
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.entry && !isDailyFinishedCache(state.entry)) {
          state.entry = null;
        }
      },
    },
  ),
);

export function loadDailyFinished(date: string): DailyFinishedCache | null {
  return useDailyFinishedStore.getState().getForDate(date);
}

export function saveDailyFinished(entry: DailyFinishedCache): void {
  useDailyFinishedStore.getState().setFinished(entry);
}

export function saveDailyAlreadyPlayed(date: string): void {
  useDailyFinishedStore.getState().setAlreadyPlayed(date);
}

export function clearDailyFinished(date: string): void {
  useDailyFinishedStore.getState().clearForDate(date);
}

export function resetDailyFinishedStore(): void {
  useDailyFinishedStore.setState({ entry: null });
  void useDailyFinishedStore.persist.clearStorage();
}
