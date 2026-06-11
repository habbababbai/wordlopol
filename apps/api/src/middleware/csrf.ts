import { API_PATH_PREFIX } from '@wordlopol/shared';
import { doubleCsrf } from 'csrf-csrf';
import { env } from '../config/env.js';

const PUBLIC_API_PREFIX = `/api${API_PATH_PREFIX}`;
const csrfCookiePath = env.NODE_ENV === 'test' ? API_PATH_PREFIX : PUBLIC_API_PREFIX;

export const CSRF_HEADER_NAME = 'x-csrf-token';

const publicAuthPaths = new Set([
  '/register',
  '/verify-email',
  '/login',
  '/forgot-password',
  '/resend-verification',
  '/reset-password',
]);

const { generateCsrfToken, doubleCsrfProtection, invalidCsrfTokenError } = doubleCsrf({
  getSecret: () => env.CSRF_SECRET,
  getSessionIdentifier: (req) => req.ip ?? 'unknown',
  cookieName: 'csrf_token',
  cookieOptions: {
    sameSite: 'lax',
    path: csrfCookiePath,
    secure: env.NODE_ENV === 'production',
    httpOnly: true,
  },
  getCsrfTokenFromRequest: (req) => {
    const value = req.headers[CSRF_HEADER_NAME];
    return typeof value === 'string' ? value : undefined;
  },
  skipCsrfProtection: (req) => {
    if (env.NODE_ENV === 'test') {
      return true;
    }

    return publicAuthPaths.has(req.path);
  },
});

export { generateCsrfToken };

export const csrfProtection = doubleCsrfProtection;

export function isInvalidCsrfTokenError(error: unknown): boolean {
  return error === invalidCsrfTokenError;
}
