import type { ApiErrorCode } from '@wordlopol/shared';
import { API_ERROR_MESSAGES } from '@wordlopol/shared';

export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: ApiErrorCode;

  constructor(statusCode: number, code: ApiErrorCode, message?: string) {
    super(message ?? API_ERROR_MESSAGES[code]);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
  }
}
