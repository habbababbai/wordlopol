import { env } from '../config/env.js';

export function withDevToken<T extends Record<string, unknown>>(
  response: T,
  token: string,
): T & { devToken?: string } {
  if (env.NODE_ENV !== 'development') {
    return response;
  }

  return { ...response, devToken: token };
}
