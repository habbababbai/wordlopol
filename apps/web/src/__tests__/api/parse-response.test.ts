import { describe, expect, it } from 'vitest';

import {
  parseApiErrorMessage,
  parseAuthResponse,
  parseRefreshResponse,
} from '@/api/parse-response';

describe('parseApiErrorMessage', () => {
  it('returns error string from API body', () => {
    expect(parseApiErrorMessage({ error: 'Invalid credentials' })).toBe('Invalid credentials');
  });

  it('returns fallback for invalid body', () => {
    expect(parseApiErrorMessage(null)).toBe('Request failed');
    expect(parseApiErrorMessage({ message: 'oops' })).toBe('Request failed');
  });
});

describe('parseRefreshResponse', () => {
  it('parses valid refresh body', () => {
    expect(parseRefreshResponse({ accessToken: 'at', refreshToken: 'rt' })).toEqual({
      accessToken: 'at',
      refreshToken: 'rt',
    });
  });

  it('throws for invalid body', () => {
    expect(() => parseRefreshResponse({ accessToken: 'at' })).toThrow('Invalid refresh response');
  });
});

describe('parseAuthResponse', () => {
  it('parses valid login body', () => {
    expect(
      parseAuthResponse({
        accessToken: 'at',
        refreshToken: 'rt',
        user: {
          id: '1',
          email: 'a@b.com',
          displayName: 'Player',
          emailVerified: true,
        },
      }),
    ).toEqual({
      accessToken: 'at',
      refreshToken: 'rt',
      user: {
        id: '1',
        email: 'a@b.com',
        displayName: 'Player',
        emailVerified: true,
      },
    });
  });

  it('throws for invalid body', () => {
    expect(() => parseAuthResponse({ accessToken: 'at' })).toThrow('Invalid auth response');
  });
});
