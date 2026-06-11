import type { Response } from 'express';

import { clearRefreshCookie, revokeAllRefreshTokens, revokeRefreshToken } from './tokens.js';

/** Clear httpOnly refresh cookies on all configured paths (see tokens.ts). */
export function clearAuthSessionResponse(res: Response): void {
  clearRefreshCookie(res);
}

/** Revoke refresh token(s) in DB and clear cookies — use from route handlers after auth mutations. */
export async function revokeAndClearAuthSession(
  res: Response,
  options: { refreshToken?: string; userId?: string },
): Promise<void> {
  if (options.refreshToken) {
    await revokeRefreshToken(options.refreshToken);
  }

  if (options.userId) {
    await revokeAllRefreshTokens(options.userId);
  }

  clearRefreshCookie(res);
}
