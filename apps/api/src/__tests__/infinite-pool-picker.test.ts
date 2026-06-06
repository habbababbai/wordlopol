import { describe, expect, it } from 'vitest';
import { buildCyclePickOrder, pickPoolWordIndexForDate, seededShuffle } from '@wordlopol/shared';

describe('pickPoolWordIndexForDate', () => {
  it('returns the same index for the same date, order, and word count', () => {
    const first = pickPoolWordIndexForDate('2026-06-06', 0, 100);
    const second = pickPoolWordIndexForDate('2026-06-06', 0, 100);

    expect(first).toBe(second);
  });

  it('returns an index within bounds for varied word counts', () => {
    for (const wordCount of [1, 7, 42, 100, 4062]) {
      const index = pickPoolWordIndexForDate('2026-06-06', 12, wordCount);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(wordCount);
    }
  });

  it('may return different indices for different orders on the same date', () => {
    const indices = new Set([
      pickPoolWordIndexForDate('2026-06-06', 0, 100),
      pickPoolWordIndexForDate('2026-06-06', 1, 100),
      pickPoolWordIndexForDate('2026-06-06', 2, 100),
    ]);

    expect(indices.size).toBeGreaterThan(1);
  });
});

describe('seededShuffle', () => {
  it('returns a permutation of indices for the given length', () => {
    const shuffled = seededShuffle(10, 'player-1:2026-06-06:0');

    expect(shuffled).toHaveLength(10);
    expect(new Set(shuffled)).toEqual(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
  });

  it('is deterministic for the same seed', () => {
    const first = seededShuffle(20, 'player-1:2026-06-06:0');
    const second = seededShuffle(20, 'player-1:2026-06-06:0');

    expect(second).toEqual(first);
  });

  it('produces a different permutation when the cycle seed changes', () => {
    const cycle0 = seededShuffle(20, 'player-1:2026-06-06:0');
    const cycle1 = seededShuffle(20, 'player-1:2026-06-06:1');

    expect(cycle1).not.toEqual(cycle0);
  });
});

describe('buildCyclePickOrder', () => {
  it('returns the first unused order from the shuffled sequence', () => {
    const shuffled = seededShuffle(5, 'player-1:2026-06-06:0');
    const usedOrders = new Set([shuffled[0], shuffled[1]]);

    const nextOrder = buildCyclePickOrder(5, usedOrders, 'player-1:2026-06-06:0');

    expect(nextOrder).toBe(shuffled[2]);
  });

  it('returns null when every order has been used', () => {
    const nextOrder = buildCyclePickOrder(3, new Set([0, 1, 2]), 'player-1:2026-06-06:0');

    expect(nextOrder).toBeNull();
  });
});
