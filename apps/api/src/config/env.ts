import { config } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';

config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env') });

const DEV_JWT_PLACEHOLDER = 'dev-only-placeholder-secret-min-32-chars!!';

const envSchema = z.object({
  DATABASE_URL: z.string().default('postgresql://wordlopol:wordlopol@localhost:5433/wordlopol'),
  JWT_ACCESS_SECRET: z.string().min(32).default(DEV_JWT_PLACEHOLDER),
  JWT_REFRESH_SECRET: z.string().min(32).default(DEV_JWT_PLACEHOLDER),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  APP_URL: z.string().url().default('http://localhost:5173'),
  API_URL: z.string().url().default('http://localhost:3001'),
  TZ: z.string().default('Europe/Warsaw'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse({
  ...process.env,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
});
