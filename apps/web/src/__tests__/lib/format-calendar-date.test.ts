import { describe, expect, it } from 'vitest';

import { formatCalendarDate } from '@/lib/format-calendar-date';

describe('formatCalendarDate', () => {
  it('formats ISO date keys for Polish locale', () => {
    expect(formatCalendarDate('2026-06-09')).toBe('9 czerwca 2026');
  });
});
