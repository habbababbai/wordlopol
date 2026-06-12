import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { usePageMetadata } from '@/hooks/usePageMetadata';

describe('usePageMetadata', () => {
  afterEach(() => {
    document.title = 'Wordlopol';
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        'content',
        'Polski Wordle — zgadnij słowo na 5 liter. Graj w trybie dziennym lub nieskończonym.',
      );
  });

  it('sets document title and meta description', () => {
    renderHook(() =>
      usePageMetadata({
        title: 'Wyzwanie dnia',
        description: 'Jedno słowo na dobę dla wszystkich graczy.',
      }),
    );

    expect(document.title).toBe('Wyzwanie dnia | Wordlopol');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Jedno słowo na dobę dla wszystkich graczy.',
    );
  });
});
