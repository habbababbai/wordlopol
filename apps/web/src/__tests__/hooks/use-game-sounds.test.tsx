import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useGameSounds } from '@/hooks/useGameSounds';
import { playTypeSound, scheduleRevealSounds } from '@/lib/game-sounds';

vi.mock('@/lib/game-sounds', () => ({
  playTypeSound: vi.fn(),
  scheduleRevealSounds: vi.fn(),
}));

const playTypeSoundMock = vi.mocked(playTypeSound);
const scheduleRevealSoundsMock = vi.mocked(scheduleRevealSounds);
const closeMock = vi.fn().mockResolvedValue(undefined);

class MockAudioContext {
  currentTime = 0;
  state: AudioContextState = 'running';
  destination = {};
  resume = vi.fn().mockResolvedValue(undefined);
  close = closeMock;
  createOscillator = vi.fn();
  createGain = vi.fn();
}

type MediaQueryMock = MediaQueryList & {
  matches: boolean;
};

function createMediaQueryMock(matches: boolean): MediaQueryMock {
  return {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
}

describe('useGameSounds', () => {
  let mediaQuery: MediaQueryMock;

  beforeEach(() => {
    playTypeSoundMock.mockReset();
    scheduleRevealSoundsMock.mockReset();
    closeMock.mockClear();

    mediaQuery = createMediaQueryMock(false);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mediaQuery),
    );
    vi.stubGlobal('AudioContext', MockAudioContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('plays type and reveal sounds when motion is allowed', async () => {
    const { result } = renderHook(() => useGameSounds());

    result.current.playType();
    result.current.playRevealSequence(['correct', 'absent']);

    await vi.waitFor(() => {
      expect(playTypeSoundMock).toHaveBeenCalledTimes(1);
      expect(scheduleRevealSoundsMock).toHaveBeenCalledWith(expect.any(MockAudioContext), [
        'correct',
        'absent',
      ]);
    });
  });

  it('skips sounds when prefers-reduced-motion is enabled', async () => {
    mediaQuery.matches = true;
    const { result } = renderHook(() => useGameSounds());

    result.current.playType();
    result.current.playRevealSequence(['present']);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(playTypeSoundMock).not.toHaveBeenCalled();
    expect(scheduleRevealSoundsMock).not.toHaveBeenCalled();
  });

  it('closes audio context on unmount', async () => {
    const { unmount, result } = renderHook(() => useGameSounds());

    result.current.playType();

    await vi.waitFor(() => {
      expect(playTypeSoundMock).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});
