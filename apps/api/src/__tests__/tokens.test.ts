import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../lib/prisma.js';
import {
  createRefreshToken,
  hashToken,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from '../lib/tokens.js';
import { createTestUser, resetDatabase } from '../test/helpers.js';

describe('tokens', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  it('signs and verifies access tokens', () => {
    const userId = 'user-123';
    const token = signAccessToken(userId);

    expect(verifyAccessToken(token)).toEqual({ userId });
  });

  it('stores refresh token hash, not plaintext', async () => {
    const user = await createTestUser();
    const { token } = await createRefreshToken(user.id);

    const stored = await prisma.refreshToken.findFirst({
      where: { userId: user.id },
    });

    expect(stored?.tokenHash).toBe(hashToken(token));
    expect(stored?.tokenHash).not.toBe(token);
  });

  it('rotates refresh token and invalidates the old one', async () => {
    const user = await createTestUser();
    const { token: oldToken } = await createRefreshToken(user.id);

    const result = await rotateRefreshToken(oldToken);

    expect(result).toMatchObject({
      userId: user.id,
      refreshToken: expect.any(String),
      accessToken: expect.any(String),
    });
    expect(verifyAccessToken(result!.accessToken)).toEqual({ userId: user.id });
    expect(result!.refreshToken).not.toBe(oldToken);

    const oldHash = hashToken(oldToken);
    const oldRecord = await prisma.refreshToken.findUnique({ where: { tokenHash: oldHash } });
    expect(oldRecord).toBeNull();

    const newRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(result!.refreshToken) },
    });
    expect(newRecord?.userId).toBe(user.id);
  });

  it('returns null when rotating an invalid refresh token', async () => {
    const result = await rotateRefreshToken('not-a-real-token');
    expect(result).toBeNull();
  });

  it('revokes a single refresh token', async () => {
    const user = await createTestUser();
    const { token } = await createRefreshToken(user.id);

    await revokeRefreshToken(token);

    const count = await prisma.refreshToken.count({ where: { userId: user.id } });
    expect(count).toBe(0);
  });

  it('revokes all refresh tokens for a user', async () => {
    const user = await createTestUser();
    await createRefreshToken(user.id);
    await createRefreshToken(user.id);

    await revokeAllRefreshTokens(user.id);

    const count = await prisma.refreshToken.count({ where: { userId: user.id } });
    expect(count).toBe(0);
  });
});
