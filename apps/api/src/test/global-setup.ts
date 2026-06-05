import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { TEST_DATABASE_URL } from './constants.js';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function getAdminConnectionString(): string {
  const url = new URL(TEST_DATABASE_URL);
  url.pathname = '/postgres';
  return url.toString();
}

async function ensureTestDatabase(): Promise<void> {
  const client = new pg.Client({ connectionString: getAdminConnectionString() });

  try {
    await client.connect();
    const result = await client.query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = 'wordlopol_test') AS exists`,
    );

    if (!result.rows[0]?.exists) {
      await client.query('CREATE DATABASE wordlopol_test');
    }
  } finally {
    await client.end();
  }
}

export default async function globalSetup(): Promise<void> {
  await ensureTestDatabase();

  execSync('pnpm exec prisma migrate deploy', {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}
