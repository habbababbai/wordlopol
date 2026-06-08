import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';

import '@/i18n';
import { resetAuthUiStore } from '@/stores/auth-ui-store';

beforeEach(() => {
  resetAuthUiStore();
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
