import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { playTypeSound, scheduleRevealSounds } from '@/lib/game-sounds';

describe('game-sounds', () => {
  const createOscillator = vi.fn();
  const createGain = vi.fn();
  let ctx: AudioContext;

  beforeEach(() => {
    createOscillator.mockReset();
    createGain.mockReset();

    const oscillator = {
      type: 'sine',
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    const gainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    createOscillator.mockReturnValue(oscillator);
    createGain.mockReturnValue(gainNode);

    ctx = {
      currentTime: 0,
      destination: {},
      createOscillator,
      createGain,
    } as unknown as AudioContext;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('plays a type sound with one oscillator', () => {
    playTypeSound(ctx);

    expect(createOscillator).toHaveBeenCalledTimes(1);
    expect(createGain).toHaveBeenCalledTimes(1);
  });

  it('schedules one reveal sound per tile result', () => {
    scheduleRevealSounds(ctx, ['correct', 'present', 'absent', 'absent', 'correct']);

    expect(createOscillator).toHaveBeenCalledTimes(5);
    expect(createGain).toHaveBeenCalledTimes(5);
  });
});
