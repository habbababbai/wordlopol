import { describe, expect, it } from 'vitest';
import { pickWordIndexForDate } from '@wordlopol/shared';

describe('pickWordIndexForDate', () => {
  it('returns the same index for the same date and word count', () => {
    const first = pickWordIndexForDate('2026-06-06', 100);
    const second = pickWordIndexForDate('2026-06-06', 100);

    expect(first).toBe(second);
  });

  it('returns an index within bounds for varied word counts', () => {
    for (const wordCount of [1, 7, 42, 100, 4062]) {
      const index = pickWordIndexForDate('2026-06-06', wordCount);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(wordCount);
    }
  });

  it('may return different indices for different dates', () => {
    const indices = new Set([
      pickWordIndexForDate('2026-06-06', 100),
      pickWordIndexForDate('2026-06-07', 100),
      pickWordIndexForDate('2026-06-08', 100),
    ]);

    expect(indices.size).toBeGreaterThan(1);
  });

  it('throws when word count is zero', () => {
    expect(() => pickWordIndexForDate('2026-06-06', 0)).toThrow('wordCount must be greater than 0');
  });
});
