import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import {
  sendEmailChangeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../lib/email.js';
import { prisma } from '../lib/prisma.js';
import {
  createRefreshToken,
  hashToken,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
  signEmailChangeToken,
  verifyEmailChangeToken,
} from '../lib/tokens.js';
import { toUserProfile } from '../lib/user-profile.js';
import { withDevToken } from '../lib/dev-auth-tokens.js';
import type { UserProfileDto } from '@wordlopol/shared';

const BCRYPT_ROUNDS = 12;
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  );
}

export class AuthError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function register(data: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ message: string }> {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });

  if (existing) {
    throw new AuthError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  let user;

  try {
    user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        displayName: data.displayName,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AuthError(409, 'Email already registered');
    }

    throw error;
  }

  const token = randomBytes(32).toString('hex');

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
    },
  });

  try {
    await sendVerificationEmail(user.email, token);
  } catch {
    await prisma.user.delete({ where: { id: user.id } });
    throw new AuthError(503, 'Email delivery failed');
  }

  return withDevToken({ message: 'Verification email sent' }, token);
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (record && record.expiresAt > new Date()) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.deleteMany({
        where: { userId: record.userId },
      }),
    ]);

    return { message: 'Email verified' };
  }

  try {
    const { userId, newEmail } = verifyEmailChangeToken(token);
    const taken = await prisma.user.findUnique({ where: { email: newEmail } });

    if (taken) {
      throw new AuthError(409, 'Email already registered');
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { email: newEmail, emailVerifiedAt: new Date() },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new AuthError(409, 'Email already registered');
      }

      throw error;
    }

    await revokeAllRefreshTokens(userId);

    return { message: 'Email changed' };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
  }

  throw new AuthError(400, 'Invalid or expired verification token');
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<{ accessToken: string; refreshToken: string; user: UserProfileDto }> {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    throw new AuthError(401, 'Invalid email or password');
  }

  if (!user.emailVerifiedAt) {
    throw new AuthError(403, 'Email not verified');
  }

  const accessToken = signAccessToken(user.id);
  const { token: refreshToken } = await createRefreshToken(user.id);

  return { accessToken, refreshToken, user: toUserProfile(user) };
}

export async function refreshSession(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const result = await rotateRefreshToken(refreshToken);

  if (!result) {
    throw new AuthError(401, 'Invalid or expired refresh token');
  }

  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  };
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
}

export async function logoutAll(userId: string): Promise<void> {
  await revokeAllRefreshTokens(userId);
}

export async function resendVerification(
  email: string,
): Promise<{ message: string; devToken?: string }> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && !user.emailVerifiedAt) {
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

    const token = randomBytes(32).toString('hex');

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
      },
    });

    try {
      await sendVerificationEmail(user.email, token);
    } catch (error) {
      console.error('[auth] Failed to send verification email:', error);
      return { message: 'If the email exists and is unverified, a verification link was sent' };
    }

    return withDevToken(
      { message: 'If the email exists and is unverified, a verification link was sent' },
      token,
    );
  }

  return { message: 'If the email exists and is unverified, a verification link was sent' };
}

export async function forgotPassword(
  email: string,
): Promise<{ message: string; devToken?: string }> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = randomBytes(32).toString('hex');

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });

    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (error) {
      console.error('[auth] Failed to send password reset email:', error);
      return { message: 'If the email exists, a reset link was sent' };
    }

    return withDevToken({ message: 'If the email exists, a reset link was sent' }, token);
  }

  return { message: 'If the email exists, a reset link was sent' };
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.expiresAt <= new Date()) {
    throw new AuthError(400, 'Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });
  await prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } });
  await revokeAllRefreshTokens(record.userId);

  return { message: 'Password reset' };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new AuthError(401, 'Invalid password');
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
  await revokeAllRefreshTokens(userId);

  return { message: 'Password changed' };
}

export async function requestEmailChange(
  userId: string,
  newEmail: string,
): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AuthError(404, 'User not found');
  }

  if (user.email === newEmail) {
    throw new AuthError(400, 'Email unchanged');
  }

  const taken = await prisma.user.findUnique({ where: { email: newEmail } });

  if (taken) {
    throw new AuthError(409, 'Email already registered');
  }

  const token = signEmailChangeToken(userId, newEmail);
  await sendEmailChangeEmail(newEmail, token);

  return withDevToken({ message: 'Verification email sent' }, token);
}

export async function changeDisplayName(
  userId: string,
  displayName: string,
): Promise<{ user: UserProfileDto }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AuthError(404, 'User not found');
  }

  if (user.displayName === displayName) {
    throw new AuthError(400, 'Display name unchanged');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { displayName },
  });

  return { user: toUserProfile(updated) };
}

export async function deleteAccount(
  userId: string,
  password: string,
): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AuthError(401, 'Invalid password');
  }

  await prisma.user.delete({ where: { id: userId } });

  return { message: 'Account deleted' };
}
