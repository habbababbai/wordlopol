import type { TFunction } from 'i18next';

const FIELD_ERROR_KEYS = {
  required: 'auth.errors.required',
  invalidEmail: 'auth.errors.invalidEmail',
  passwordMismatch: 'auth.errors.passwordMismatch',
  passwordTooShort: 'auth.errors.passwordTooShort',
} as const;

type FieldErrorKey = keyof typeof FIELD_ERROR_KEYS;

export function getFormFieldError(errors: unknown, field: string): string | undefined {
  if (errors === null || errors === undefined || typeof errors !== 'object') {
    return undefined;
  }

  const fieldError = (errors as Record<string, unknown>)[field];

  if (
    fieldError !== null &&
    fieldError !== undefined &&
    typeof fieldError === 'object' &&
    'message' in fieldError &&
    typeof fieldError.message === 'string'
  ) {
    return fieldError.message;
  }

  return undefined;
}

export function translateFieldError(message: string | undefined, t: TFunction): string | undefined {
  if (!message) {
    return undefined;
  }

  if (message in FIELD_ERROR_KEYS) {
    return t(FIELD_ERROR_KEYS[message as FieldErrorKey]);
  }

  return message;
}
