import type { ApiErrorCode } from '@wordlopol/shared';

import i18n from '../i18n';
import { ApiError } from '../api/errors';

function getApiErrorMessageByCode(code: ApiErrorCode): string | null {
  const translated = i18n.t(`common.apiErrors.${code}`, { defaultValue: '' });
  return translated || null;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.code) {
      const translated = getApiErrorMessageByCode(error.code);
      if (translated) {
        return translated;
      }
    }

    return error.message;
  }

  return fallback;
}
