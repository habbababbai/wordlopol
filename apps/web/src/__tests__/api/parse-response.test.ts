import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/errors';
import {
  parseApiError,
  parseApiErrorMessage,
  parseAuthResponse,
  parseRefreshResponse,
} from '@/api/parse-response';
import { getApiErrorMessage } from '@/lib/api-error-message';

describe('parseApiError', () => {
  it('returns code and message from structured API body', () => {
    expect(
      parseApiError({
        error: { code: 'EMAIL_NOT_VERIFIED', message: 'Email not verified' },
      }),
    ).toEqual({
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Email not verified',
    });
  });

  it('falls back for legacy string error body', () => {
    expect(parseApiError({ error: 'Invalid credentials' })).toEqual({
      code: null,
      message: 'Invalid credentials',
    });
  });

  it('returns fallback for invalid body', () => {
    expect(parseApiError(null)).toEqual({
      code: null,
      message: 'Request failed',
    });
    expect(parseApiError({ message: 'oops' })).toEqual({
      code: null,
      message: 'Request failed',
    });
  });
});

describe('parseApiErrorMessage', () => {
  it('returns message from structured API body', () => {
    expect(
      parseApiErrorMessage({
        error: { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' },
      }),
    ).toBe('Invalid email or password');
  });

  it('returns fallback for invalid body', () => {
    expect(parseApiErrorMessage(null)).toBe('Request failed');
  });
});

describe('getApiErrorMessage', () => {
  it('maps ApiError code to Polish copy', () => {
    const error = new ApiError(403, 'Email not verified', 'EMAIL_NOT_VERIFIED');
    expect(getApiErrorMessage(error, 'fallback')).toBe('Potwierdź adres e-mail przed logowaniem');
  });

  it('returns fallback for unknown errors', () => {
    expect(getApiErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
  });

  it('returns English message when code has no translation', () => {
    const error = new ApiError(500, 'Custom failure', null);
    expect(getApiErrorMessage(error, 'fallback')).toBe('Custom failure');
  });
});

describe('parseRefreshResponse', () => {
  it('parses valid refresh body', () => {
    expect(parseRefreshResponse({ accessToken: 'at' })).toEqual({
      accessToken: 'at',
    });
  });

  it('throws for invalid body', () => {
    expect(() => parseRefreshResponse({ refreshToken: 'rt' })).toThrow('Invalid refresh response');
  });
});

describe('parseAuthResponse', () => {
  it('parses valid login body', () => {
    expect(
      parseAuthResponse({
        accessToken: 'at',
        user: {
          id: '1',
          email: 'a@b.com',
          displayName: 'Player',
          emailVerified: true,
        },
      }),
    ).toEqual({
      accessToken: 'at',
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
