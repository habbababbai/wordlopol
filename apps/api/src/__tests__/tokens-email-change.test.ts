import { describe, expect, it } from 'vitest';
import { signEmailChangeToken, verifyEmailChangeToken } from '../lib/tokens.js';

describe('email change tokens', () => {
  it('signs and verifies email change token', () => {
    const token = signEmailChangeToken('user-123', 'new@example.com');

    expect(verifyEmailChangeToken(token)).toEqual({
      userId: 'user-123',
      newEmail: 'new@example.com',
    });
  });
});
