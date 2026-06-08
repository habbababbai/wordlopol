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

function getTestDatabaseName(): string {
  const name = new URL(TEST_DATABASE_URL).pathname.replace(/^\//, '');

  if (!name || !/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error('TEST_DATABASE_URL must include a valid database name');
  }

  return name;
}

async function ensureTestDatabase(): Promise<void> {
  const testDbName = getTestDatabaseName();
  const client = new pg.Client({ connectionString: getAdminConnectionString() });

  try {
    await client.connect();
    const result = await client.query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists`,
      [testDbName],
    );

    if (!result.rows[0]?.exists) {
      await client.query(`CREATE DATABASE "${testDbName.replace(/"/g, '""')}"`);
    }
  } finally {
    await client.end();
  }
}

function isConnectionRefused(error: unknown): boolean {
  if (error instanceof AggregateError) {
    return error.errors.some((cause) => (cause as NodeJS.ErrnoException).code === 'ECONNREFUSED');
  }

  return (error as NodeJS.ErrnoException).code === 'ECONNREFUSED';
}

export default async function globalSetup(): Promise<void> {
  try {
    await ensureTestDatabase();

    execSync('pnpm exec prisma migrate deploy', {
      cwd: apiRoot,
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'inherit',
    });
  } catch (error) {
    if (isConnectionRefused(error)) {
      throw new Error(
        'Test database unavailable at localhost:5433. Run `docker compose up -d` from the repo root.',
        { cause: error },
      );
    }

    throw error;
  }
}
