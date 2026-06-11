import { createHash, randomBytes } from 'node:crypto';
import type { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from './http-error.js';
import { prisma } from './prisma.js';

export const REFRESH_COOKIE_NAME = 'refresh_token';
export const ACCESS_TOKEN_TTL_SEC = 15 * 60;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AccessTokenPayload {
  userId: string;
}

export interface RefreshTokenResult {
  token: string;
  expiresAt: Date;
}

export interface RotateRefreshResult {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

export function signAccessToken(userId: string): string {
  return jwt.sign({}, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: ACCESS_TOKEN_TTL_SEC,
  });
}

export interface EmailChangeTokenPayload {
  userId: string;
  newEmail: string;
}

export function signEmailChangeToken(userId: string, newEmail: string): string {
  return jwt.sign({ newEmail, purpose: 'email-change' }, env.JWT_EMAIL_CHANGE_SECRET, {
    subject: userId,
    expiresIn: '24h',
  });
}

export function verifyEmailChangeToken(token: string): EmailChangeTokenPayload {
  const payload = jwt.verify(token, env.JWT_EMAIL_CHANGE_SECRET);

  if (
    typeof payload === 'string' ||
    payload.purpose !== 'email-change' ||
    typeof payload.sub !== 'string' ||
    typeof payload.newEmail !== 'string'
  ) {
    throw new HttpError(401, 'Invalid email change token');
  }

  return { userId: payload.sub, newEmail: payload.newEmail };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    throw new HttpError(401, 'Invalid access token');
  }

  return { userId: payload.sub };
}

export function getRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: env.REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_MS,
  };
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, getRefreshCookieOptions());
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    path: env.REFRESH_COOKIE_PATH,
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
  });
}

export async function createRefreshToken(userId: string): Promise<RefreshTokenResult> {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function rotateRefreshToken(oldToken: string): Promise<RotateRefreshResult | null> {
  const tokenHash = hashToken(oldToken);

  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!existing || existing.expiresAt <= new Date()) {
    return null;
  }

  const { count } = await prisma.refreshToken.deleteMany({ where: { id: existing.id } });

  if (count === 0) {
    return null;
  }

  const { token: refreshToken } = await createRefreshToken(existing.userId);

  return {
    userId: existing.userId,
    accessToken: signAccessToken(existing.userId),
    refreshToken,
  };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { tokenHash: hashToken(token) },
  });
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}
