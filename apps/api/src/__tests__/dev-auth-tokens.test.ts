import { describe, expect, it, vi } from 'vitest';

vi.mock('../config/env.js', () => ({
  env: { NODE_ENV: 'development' },
}));

import { withDevToken } from '../lib/dev-auth-tokens.js';

describe('withDevToken', () => {
  it('adds devToken in development', () => {
    expect(withDevToken({ message: 'sent' }, 'abc123')).toEqual({
      message: 'sent',
      devToken: 'abc123',
    });
  });
});
