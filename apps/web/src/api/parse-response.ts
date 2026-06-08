function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export type ParsedRefreshResponse = {
  accessToken: string;
};

export type ParsedAuthResponse = {
  accessToken: string;
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
  if (isRecord(data) && typeof data.accessToken === 'string') {
    return {
      accessToken: data.accessToken,
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
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
    },
  };
}
