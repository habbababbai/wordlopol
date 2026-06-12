import type { LetterResult } from '@wordlopol/shared';
import { useCallback, useEffect, useRef } from 'react';

import { playTypeSound, scheduleRevealSounds } from '@/lib/game-sounds';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useGameSounds(): {
  playType: () => void;
  playRevealSequence: (results: LetterResult[]) => void;
} {
  const enabledRef = useRef(!prefersReducedMotion());
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncEnabled = (): void => {
      enabledRef.current = !mediaQuery.matches;
    };

    syncEnabled();
    mediaQuery.addEventListener('change', syncEnabled);

    return () => {
      mediaQuery.removeEventListener('change', syncEnabled);
    };
  }, []);

  useEffect(() => {
    return () => {
      void contextRef.current?.close();
      contextRef.current = null;
    };
  }, []);

  const ensureContext = useCallback(async (): Promise<AudioContext | null> => {
    if (!enabledRef.current || typeof window === 'undefined') return null;

    contextRef.current ??= new AudioContext();

    if (contextRef.current.state === 'suspended') {
      await contextRef.current.resume();
    }

    return contextRef.current;
  }, []);

  const playType = useCallback(() => {
    void ensureContext().then((ctx) => {
      if (ctx) playTypeSound(ctx);
    });
  }, [ensureContext]);

  const playRevealSequence = useCallback(
    (results: LetterResult[]) => {
      void ensureContext().then((ctx) => {
        if (ctx) scheduleRevealSounds(ctx, results);
      });
    },
    [ensureContext],
  );

  return { playType, playRevealSequence };
}
