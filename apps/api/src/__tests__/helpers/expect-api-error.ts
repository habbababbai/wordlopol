import type { ApiErrorCode } from '@wordlopol/shared';
import { API_ERROR_MESSAGES } from '@wordlopol/shared';

export function expectApiError(code: ApiErrorCode, message?: string) {
  return {
    error: {
      code,
      message: message ?? API_ERROR_MESSAGES[code],
    },
  };
}
