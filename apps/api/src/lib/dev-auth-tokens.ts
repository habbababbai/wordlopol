import { env } from '@/config/env.js';

export function withDevToken<T extends Record<string, unknown>>(
  response: T,
  token: string,
  devAccessToken?: string | (() => string),
): T & { devToken?: string; devAccessToken?: string } {
  if (env.NODE_ENV !== 'development') {
    return response;
  }

  const accessToken = typeof devAccessToken === 'function' ? devAccessToken() : devAccessToken;

  return {
    ...response,
    devToken: token,
    ...(accessToken !== undefined && { devAccessToken: accessToken }),
  };
}
