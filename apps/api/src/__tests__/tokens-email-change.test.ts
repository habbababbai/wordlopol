import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { env } from '../config/env.js';
import { signEmailChangeToken, verifyEmailChangeToken } from '../lib/tokens.js';

describe('email change tokens', () => {
  it('signs and verifies email change token', () => {
    const token = signEmailChangeToken('user-123', 'new@example.com');

    expect(verifyEmailChangeToken(token)).toEqual({
      userId: 'user-123',
      newEmail: 'new@example.com',
    });
  });

  it('cannot be verified with JWT_REFRESH_SECRET', () => {
    const token = signEmailChangeToken('user-123', 'new@example.com');

    expect(() => jwt.verify(token, env.JWT_REFRESH_SECRET)).toThrow();
  });
});
