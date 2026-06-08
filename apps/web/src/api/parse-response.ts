function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export type ParsedRefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export type ParsedAuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    emailVerified: boolean;
  };
};

export function parseApiErrorMessage(data: unknown): string {
  if (isRecord(data) && typeof data.error === 'string') {
    return data.error;
  }

  return 'Request failed';
}

export function parseRefreshResponse(data: unknown): ParsedRefreshResponse {
  if (
    isRecord(data) &&
    typeof data.accessToken === 'string' &&
    typeof data.refreshToken === 'string'
  ) {
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  }

  throw new Error('Invalid refresh response');
}

export function parseAuthResponse(data: unknown): ParsedAuthResponse {
  if (!isRecord(data) || typeof data.accessToken !== 'string') {
    throw new Error('Invalid auth response');
  }

  const user = data.user;
  if (
    !isRecord(user) ||
    typeof user.id !== 'string' ||
    typeof user.email !== 'string' ||
    typeof user.displayName !== 'string' ||
    typeof user.emailVerified !== 'boolean'
  ) {
    throw new Error('Invalid auth response');
  }

  return {
    accessToken: data.accessToken,
    refreshToken: typeof data.refreshToken === 'string' ? data.refreshToken : '',
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
    },
  };
}
