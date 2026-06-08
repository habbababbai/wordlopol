import { config } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';

config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env') });

const DEV_JWT_PLACEHOLDER = 'dev-only-placeholder-secret-min-32-chars!!';
const DEV_CSRF_PLACEHOLDER = 'dev-only-csrf-secret-min-32-chars!!';

const nodeEnv = process.env.NODE_ENV ?? 'development';
const defaultRefreshCookiePath = nodeEnv === 'test' ? '/auth' : '/api/auth';

const envSchema = z
  .object({
    DATABASE_URL: z.string().default('postgresql://wordlopol:wordlopol@localhost:5433/wordlopol'),
    JWT_ACCESS_SECRET: z.string().min(32).default(DEV_JWT_PLACEHOLDER),
    JWT_REFRESH_SECRET: z.string().min(32).default(DEV_JWT_PLACEHOLDER),
    CSRF_SECRET: z.string().min(32).default(DEV_CSRF_PLACEHOLDER),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().email().optional(),
    APP_URL: z.string().url().default('http://localhost:5173'),
    API_URL: z.string().url().default('http://localhost:3001'),
    TZ: z.string().default('Europe/Warsaw'),
    PORT: z.coerce.number().default(3001),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    REFRESH_COOKIE_PATH: z.string().default(defaultRefreshCookiePath),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'production') {
      return;
    }

    if (
      data.JWT_ACCESS_SECRET === DEV_JWT_PLACEHOLDER ||
      data.JWT_REFRESH_SECRET === DEV_JWT_PLACEHOLDER ||
      data.CSRF_SECRET === DEV_CSRF_PLACEHOLDER
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, and CSRF_SECRET must be set in production',
      });
    }

    if (data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ in production',
      });
    }
  });

export const env = envSchema.parse({
  ...process.env,
  NODE_ENV: nodeEnv,
});
