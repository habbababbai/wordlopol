import { describe, expect, it, vi } from 'vitest';

vi.mock('../config/env.js', () => ({
  env: { NODE_ENV: 'test' },
}));

import { withDevToken } from '../lib/dev-auth-tokens.js';

describe('withDevToken in test env', () => {
  it('does not add devToken outside development', () => {
    expect(withDevToken({ message: 'sent' }, 'abc123')).toEqual({ message: 'sent' });
  });

  it('does not add devAccessToken outside development even when a third arg is passed', () => {
    expect(withDevToken({ message: 'sent' }, 'abc123', 'jwt-token')).toEqual({
      message: 'sent',
    });
    expect(withDevToken({ message: 'sent' }, 'abc123', () => 'jwt-token')).toEqual({
      message: 'sent',
    });
  });
});
