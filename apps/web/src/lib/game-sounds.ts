import type { LetterResult } from '@wordlopol/shared';

import { TILE_FLIP_DELAY_MS } from '@/lib/game-animation';

const REVEAL_FREQUENCIES: Record<LetterResult, number> = {
  correct: 620,
  present: 480,
  absent: 320,
};

function playTone(
  ctx: AudioContext,
  frequency: number,
  durationSec: number,
  startTime: number,
  gain = 0.08,
): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + durationSec);
}

export function playTypeSound(ctx: AudioContext): void {
  playTone(ctx, 880, 0.04, ctx.currentTime, 0.06);
}

export function scheduleRevealSounds(ctx: AudioContext, results: LetterResult[]): void {
  const startBase = ctx.currentTime;

  results.forEach((result, index) => {
    const startTime = startBase + (index * TILE_FLIP_DELAY_MS) / 1000;
    playTone(ctx, REVEAL_FREQUENCIES[result], 0.12, startTime, 0.07);
  });
}
