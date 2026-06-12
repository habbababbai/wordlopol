import { API_PATH_PREFIX } from '@wordlopol/shared';
import type { Express } from 'express';
import request from 'supertest';

export function apiPath(path: string): string {
  return `${API_PATH_PREFIX}${path}`;
}

export async function createTestApp(): Promise<Express> {
  const { createApp } = await import('@/app.js');
  return createApp();
}

export async function createTestAgent() {
  const app = await createTestApp();
  return request.agent(app);
}

export async function createVerifiedUserWithPassword(password = 'secure-password') {
  const bcrypt = await import('bcrypt');
  const { prisma } = await import('@/lib/prisma.js');

  const user = await prisma.user.create({
    data: {
      email: `user-${crypto.randomUUID()}@example.com`,
      passwordHash: await bcrypt.hash(password, 12),
      displayName: 'Test Player',
      emailVerifiedAt: new Date(),
    },
  });

  return { user, password };
}

export async function createTestUser(options?: { emailVerified?: boolean; email?: string }) {
  const { prisma } = await import('@/lib/prisma.js');

  return prisma.user.create({
    data: {
      email: options?.email ?? `user-${crypto.randomUUID()}@example.com`,
      passwordHash: 'test-password-hash',
      displayName: 'Test Player',
      emailVerifiedAt: options?.emailVerified ? new Date() : null,
    },
  });
}

export async function resetDatabase(): Promise<void> {
  const { prisma } = await import('@/lib/prisma.js');

  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename != '_prisma_migrations'
  `;

  for (const { tablename } of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE`);
  }
}

export async function seedDictionaryWords(texts: string[]): Promise<void> {
  const { prisma } = await import('@/lib/prisma.js');

  await prisma.word.createMany({
    data: texts.map((text) => ({ text, length: text.length })),
  });
}

/** Picks a dictionary word known to differ from `answer`; throws if none exist. */
export function pickWrongWord(words: string[], answer: string): string {
  const wrong = words.find((word) => word !== answer);
  if (!wrong) {
    throw new Error(`No wrong word available (answer=${answer}, pool=${words.join(', ')})`);
  }
  return wrong;
}

export async function startGuestDailySession(
  agent: Awaited<ReturnType<typeof createTestAgent>>,
): Promise<void> {
  await agent.get(apiPath('/daily/today')).expect(200);
}
