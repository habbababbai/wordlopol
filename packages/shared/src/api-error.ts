export const API_ERROR_CODES = [
  'ALREADY_PLAYED_TODAY',
  'CONCURRENT_GUESS_CONFLICT',
  'DICTIONARY_NOT_LOADED',
  'DISPLAY_NAME_UNCHANGED',
  'EMAIL_ALREADY_REGISTERED',
  'EMAIL_DELIVERY_FAILED',
  'EMAIL_NOT_VERIFIED',
  'EMAIL_UNCHANGED',
  'GAME_ALREADY_FINISHED',
  'GUEST_SESSION_REQUIRED',
  'GUESS_WRONG_LENGTH',
  'INTERNAL_ERROR',
  'INVALID_ACCESS_TOKEN',
  'INVALID_CSRF_TOKEN',
  'INVALID_EMAIL_CHANGE_TOKEN',
  'INVALID_EMAIL_OR_PASSWORD',
  'INVALID_PASSWORD',
  'INVALID_REFRESH_TOKEN',
  'INVALID_RESET_TOKEN',
  'INVALID_VERIFICATION_TOKEN',
  'MISSING_REFRESH_TOKEN',
  'NOT_FOUND',
  'NOT_IN_DICTIONARY',
  'NO_WORD_IN_PROGRESS',
  'TOO_MANY_REQUESTS',
  'UNAUTHORIZED',
  'USER_NOT_FOUND',
  'VALIDATION_ERROR',
  'WORD_ALREADY_COMPLETED',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorBodyDto {
  code: ApiErrorCode;
  message: string;
}

export interface ApiErrorResponseDto {
  error: ApiErrorBodyDto;
}

export const API_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  ALREADY_PLAYED_TODAY: 'Already played today',
  CONCURRENT_GUESS_CONFLICT: 'Concurrent guess conflict',
  DICTIONARY_NOT_LOADED: 'Dictionary not loaded',
  DISPLAY_NAME_UNCHANGED: 'Display name unchanged',
  EMAIL_ALREADY_REGISTERED: 'Email already registered',
  EMAIL_DELIVERY_FAILED: 'Email delivery failed',
  EMAIL_NOT_VERIFIED: 'Email not verified',
  EMAIL_UNCHANGED: 'Email unchanged',
  GAME_ALREADY_FINISHED: 'Game already finished',
  GUEST_SESSION_REQUIRED: 'Guest session required',
  GUESS_WRONG_LENGTH: 'Guess must be 5 letters',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_ACCESS_TOKEN: 'Invalid access token',
  INVALID_CSRF_TOKEN: 'Invalid CSRF token',
  INVALID_EMAIL_CHANGE_TOKEN: 'Invalid email change token',
  INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
  INVALID_PASSWORD: 'Invalid password',
  INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token',
  INVALID_VERIFICATION_TOKEN: 'Invalid or expired verification token',
  MISSING_REFRESH_TOKEN: 'Missing refresh token',
  NOT_FOUND: 'Not found',
  NOT_IN_DICTIONARY: 'Not in dictionary',
  NO_WORD_IN_PROGRESS: 'No word in progress',
  TOO_MANY_REQUESTS: 'Too many requests',
  UNAUTHORIZED: 'Unauthorized',
  USER_NOT_FOUND: 'User not found',
  VALIDATION_ERROR: 'Invalid request',
  WORD_ALREADY_COMPLETED: 'Word already completed',
};

export function formatApiErrorResponse(code: ApiErrorCode, message?: string): ApiErrorResponseDto {
  return {
    error: {
      code,
      message: message ?? API_ERROR_MESSAGES[code],
    },
  };
}

export function isApiErrorResponse(data: unknown): data is ApiErrorResponseDto {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const error = (data as ApiErrorResponseDto).error;
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return (
    typeof error.code === 'string' &&
    API_ERROR_CODES.includes(error.code as ApiErrorCode) &&
    typeof error.message === 'string'
  );
}
