import { API_PATH_PREFIX } from '@wordlopol/shared';
import { config } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';

config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env') });

const DEV_JWT_PLACEHOLDER = 'dev-only-placeholder-secret-min-32-chars!!';
const DEV_EMAIL_CHANGE_PLACEHOLDER = 'dev-only-email-change-secret-min-32-chars!!';
const DEV_CSRF_PLACEHOLDER = 'dev-only-csrf-secret-min-32-chars!!';

const PUBLIC_API_PREFIX = `/api${API_PATH_PREFIX}`;

const nodeEnv = process.env.NODE_ENV ?? 'development';
const defaultRefreshCookiePath =
  nodeEnv === 'test' ? `${API_PATH_PREFIX}/auth` : `${PUBLIC_API_PREFIX}/auth`;
const defaultGuestDailySessionCookiePath =
  nodeEnv === 'test' ? `${API_PATH_PREFIX}/daily` : `${PUBLIC_API_PREFIX}/daily`;

const envSchema = z
  .object({
    DATABASE_URL: z.string().default('postgresql://wordlopol:wordlopol@localhost:5433/wordlopol'),
    JWT_ACCESS_SECRET: z.string().min(32).default(DEV_JWT_PLACEHOLDER),
    JWT_REFRESH_SECRET: z.string().min(32).default(DEV_JWT_PLACEHOLDER),
    JWT_EMAIL_CHANGE_SECRET: z.string().min(32).default(DEV_EMAIL_CHANGE_PLACEHOLDER),
    CSRF_SECRET: z.string().min(32).default(DEV_CSRF_PLACEHOLDER),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().email().optional(),
    APP_URL: z.string().url().default('http://localhost:5173'),
    API_URL: z.string().url().default('http://localhost:3001'),
    TZ: z.string().default('Europe/Warsaw'),
    PORT: z.coerce.number().default(3001),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    REFRESH_COOKIE_PATH: z.string().default(defaultRefreshCookiePath),
    GUEST_DAILY_SESSION_COOKIE_PATH: z.string().default(defaultGuestDailySessionCookiePath),
    RATE_LIMIT_ENABLED: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => value === 'true'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'production') {
      return;
    }

    if (
      data.JWT_ACCESS_SECRET === DEV_JWT_PLACEHOLDER ||
      data.JWT_REFRESH_SECRET === DEV_JWT_PLACEHOLDER ||
      data.JWT_EMAIL_CHANGE_SECRET === DEV_EMAIL_CHANGE_PLACEHOLDER ||
      data.CSRF_SECRET === DEV_CSRF_PLACEHOLDER
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_EMAIL_CHANGE_SECRET, and CSRF_SECRET must be set in production',
      });
    }

    const secrets = [data.JWT_ACCESS_SECRET, data.JWT_REFRESH_SECRET, data.JWT_EMAIL_CHANGE_SECRET];
    if (new Set(secrets).size !== secrets.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, and JWT_EMAIL_CHANGE_SECRET must differ in production',
      });
    }
  });

export const env = envSchema.parse({
  ...process.env,
  NODE_ENV: nodeEnv,
});
