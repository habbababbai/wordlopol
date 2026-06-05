import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { sendVerificationEmail } from '../lib/email.js';
import { prisma } from '../lib/prisma.js';
import { createRefreshToken, hashToken, signAccessToken } from '../lib/tokens.js';

const BCRYPT_ROUNDS = 12;
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

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
  displayName?: string;
}): Promise<{ message: string }> {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });

  if (existing) {
    throw new AuthError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      displayName: data.displayName,
    },
  });

  const token = randomBytes(32).toString('hex');

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
    },
  });

  await sendVerificationEmail(user.email, token);

  return { message: 'Verification email sent' };
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.expiresAt <= new Date()) {
    throw new AuthError(400, 'Invalid or expired verification token');
  }

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

export async function login(data: {
  email: string;
  password: string;
}): Promise<{ accessToken: string; refreshToken: string }> {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    throw new AuthError(401, 'Invalid email or password');
  }

  if (!user.emailVerifiedAt) {
    throw new AuthError(403, 'Email not verified');
  }

  const accessToken = signAccessToken(user.id);
  const { token: refreshToken } = await createRefreshToken(user.id);

  return { accessToken, refreshToken };
}
