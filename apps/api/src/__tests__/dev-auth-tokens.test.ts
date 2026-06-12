import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env.js', () => ({
  env: { NODE_ENV: 'development' },
}));

import { withDevToken } from '@/lib/dev-auth-tokens.js';

describe('withDevToken', () => {
  it('adds devToken in development', () => {
    expect(withDevToken({ message: 'sent' }, 'abc123')).toEqual({
      message: 'sent',
      devToken: 'abc123',
    });
  });

  it('adds devAccessToken when provided in development', () => {
    expect(withDevToken({ message: 'sent' }, 'abc123', 'jwt-token')).toEqual({
      message: 'sent',
      devToken: 'abc123',
      devAccessToken: 'jwt-token',
    });
  });

  it('calls devAccessToken factory only in development', () => {
    let called = false;
    expect(
      withDevToken({ message: 'sent' }, 'abc123', () => {
        called = true;
        return 'jwt-token';
      }),
    ).toEqual({
      message: 'sent',
      devToken: 'abc123',
      devAccessToken: 'jwt-token',
    });
    expect(called).toBe(true);
  });
});
