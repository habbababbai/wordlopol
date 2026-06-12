import type { ApiErrorCode } from '@wordlopol/shared';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | null;

  constructor(status: number, message: string, code: ApiErrorCode | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}
