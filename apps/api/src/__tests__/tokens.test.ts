import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { prisma } from '@/lib/prisma.js';
import { HttpError } from '@/lib/http-error.js';
import {
  createRefreshToken,
  hashToken,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from '@/lib/tokens.js';
import { createTestUser, resetDatabase } from '@/test/helpers.js';

describe('tokens', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  it('signs and verifies access tokens', () => {
    const userId = 'user-123';
    const token = signAccessToken(userId, true);

    expect(verifyAccessToken(token)).toEqual({ userId, emailVerified: true });
  });

  it('round-trips emailVerified false in access tokens', () => {
    const token = signAccessToken('user-123', false);

    expect(verifyAccessToken(token)).toEqual({ userId: 'user-123', emailVerified: false });
  });

  it('throws INVALID_ACCESS_TOKEN for invalid access tokens', () => {
    expect(() => verifyAccessToken('not-a-valid-token')).toThrow(HttpError);

    try {
      verifyAccessToken('not-a-valid-token');
    } catch (error) {
      expect(error).toMatchObject({ statusCode: 401, code: 'INVALID_ACCESS_TOKEN' });
    }
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
    expect(verifyAccessToken(result!.accessToken)).toEqual({
      userId: user.id,
      emailVerified: false,
    });
    expect(result!.refreshToken).not.toBe(oldToken);

    const oldHash = hashToken(oldToken);
    const oldRecord = await prisma.refreshToken.findUnique({ where: { tokenHash: oldHash } });
    expect(oldRecord).toBeNull();

    const newRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(result!.refreshToken) },
    });
    expect(newRecord?.userId).toBe(user.id);
  });

  it('embeds emailVerified in access tokens issued during refresh', async () => {
    const user = await createTestUser({ emailVerified: true });
    const { token: oldToken } = await createRefreshToken(user.id);

    const result = await rotateRefreshToken(oldToken);

    expect(verifyAccessToken(result!.accessToken)).toEqual({
      userId: user.id,
      emailVerified: true,
    });
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

  it('sets refresh cookie on both dev paths when NODE_ENV is development', async () => {
    vi.resetModules();
    vi.doMock('@/config/env.js', () => ({
      env: {
        NODE_ENV: 'development',
        REFRESH_COOKIE_PATH: '/api/v1/auth',
        JWT_ACCESS_SECRET: 'test-access-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_EMAIL_CHANGE_SECRET: 'test-email-change-secret',
      },
    }));

    const { setRefreshCookie: setDevRefreshCookie } = await import('@/lib/tokens.js');
    const cookies: Array<{ name: string; path: string }> = [];
    const res = {
      cookie(name: string, _value: string, options: { path?: string }) {
        cookies.push({ name, path: options.path ?? '' });
      },
    } as unknown as Response;

    setDevRefreshCookie(res, 'refresh-token');

    expect(cookies).toEqual([
      { name: 'refresh_token', path: '/api/v1/auth' },
      { name: 'refresh_token', path: '/v1/auth' },
    ]);

    vi.doUnmock('@/config/env.js');
    vi.resetModules();
  });

  it('clears refresh cookie on both dev paths when NODE_ENV is development', async () => {
    vi.resetModules();
    vi.doMock('@/config/env.js', () => ({
      env: {
        NODE_ENV: 'development',
        REFRESH_COOKIE_PATH: '/api/v1/auth',
        JWT_ACCESS_SECRET: 'test-access-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_EMAIL_CHANGE_SECRET: 'test-email-change-secret',
      },
    }));

    const { clearRefreshCookie: clearDevRefreshCookie } = await import('@/lib/tokens.js');
    const cleared: string[] = [];
    const res = {
      clearCookie(name: string, options: { path?: string }) {
        cleared.push(options.path ?? '');
      },
    } as unknown as Response;

    clearDevRefreshCookie(res);

    expect(cleared).toEqual(['/api/v1/auth', '/v1/auth']);

    vi.doUnmock('@/config/env.js');
    vi.resetModules();
  });
});
