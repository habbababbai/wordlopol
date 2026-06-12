import type { ApiErrorCode } from '@wordlopol/shared';
import { formatApiErrorResponse } from '@wordlopol/shared';
import type { Response } from 'express';

export function sendApiError(
  res: Response,
  statusCode: number,
  code: ApiErrorCode,
  message?: string,
): void {
  res.status(statusCode).json(formatApiErrorResponse(code, message));
}
