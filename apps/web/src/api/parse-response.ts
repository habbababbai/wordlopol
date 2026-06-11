import { isApiErrorResponse, type ApiErrorCode } from '@wordlopol/shared';

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

export type ParsedApiError = {
  code: ApiErrorCode | null;
  message: string;
};

const REQUEST_FAILED: ParsedApiError = { code: null, message: 'Request failed' };

export function parseApiError(data: unknown): ParsedApiError {
  if (isApiErrorResponse(data)) {
    return {
      code: data.error.code,
      message: data.error.message,
    };
  }

  if (isRecord(data) && typeof data.error === 'string') {
    return {
      code: null,
      message: data.error,
    };
  }

  return REQUEST_FAILED;
}

export function parseApiErrorMessage(data: unknown): string {
  return parseApiError(data).message;
}

export async function parseApiErrorFromResponse(res: Response): Promise<ParsedApiError> {
  try {
    const data: unknown = await res.json();
    return parseApiError(data);
  } catch {
    return REQUEST_FAILED;
  }
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
