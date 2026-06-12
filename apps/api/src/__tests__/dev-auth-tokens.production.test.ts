import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env.js', () => ({
  env: { NODE_ENV: 'production' },
}));

import { withDevToken } from '@/lib/dev-auth-tokens.js';

describe('withDevToken in production env', () => {
  it('does not add devToken in production', () => {
    expect(withDevToken({ message: 'sent' }, 'abc123')).toEqual({ message: 'sent' });
  });

  it('does not add devAccessToken in production', () => {
    expect(withDevToken({ message: 'sent' }, 'abc123', 'jwt-token')).toEqual({
      message: 'sent',
    });
  });
});
