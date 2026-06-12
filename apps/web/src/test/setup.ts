import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';

import '@/i18n';
import { resetAuthUiStore } from '@/stores/auth-ui-store';

class MockAudioContext {
  currentTime = 0;
  state: AudioContextState = 'running';
  destination = {};
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
  createOscillator = vi.fn(() => ({
    type: 'sine',
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }));
  createGain = vi.fn(() => ({
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  }));
}

beforeEach(() => {
  resetAuthUiStore();
  vi.stubGlobal('AudioContext', MockAudioContext);
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  );
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      if (url.includes('/auth/refresh')) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: 'Missing refresh token' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }

      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});
