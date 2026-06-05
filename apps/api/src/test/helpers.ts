import type { Express } from 'express';
import request from 'supertest';

export async function createTestApp(): Promise<Express> {
  const { createApp } = await import('../app.js');
  return createApp();
}

export async function createTestAgent() {
  const app = await createTestApp();
  return request(app);
}

export async function createTestUser(options?: { emailVerified?: boolean; email?: string }) {
  const { prisma } = await import('../lib/prisma.js');

  return prisma.user.create({
    data: {
      email: options?.email ?? `user-${crypto.randomUUID()}@example.com`,
      passwordHash: 'test-password-hash',
      emailVerifiedAt: options?.emailVerified ? new Date() : null,
    },
  });
}

export async function resetDatabase(): Promise<void> {
  const { prisma } = await import('../lib/prisma.js');

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
