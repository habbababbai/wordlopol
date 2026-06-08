import { describe, expect, it } from 'vitest';

import type {
  EmailOnlyFormValues,
  LoginFormValues,
  RegisterFormValues,
  ResetPasswordFormValues,
} from '@/lib/auth-form-types';
import {
  emailOnlySchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/lib/auth-schemas';

describe('auth-schemas', () => {
  it('accepts valid login values', () => {
    const sample: LoginFormValues = { email: 'player@example.com', password: 'secret' };
    expect(loginSchema.safeParse(sample).success).toBe(true);
  });

  it('accepts valid register values', () => {
    const sample: RegisterFormValues = {
      email: 'player@example.com',
      displayName: 'Player',
      password: 'secret12',
      confirmPassword: 'secret12',
    };
    expect(registerSchema.safeParse(sample).success).toBe(true);
  });

  it('rejects register password mismatch', () => {
    const sample: RegisterFormValues = {
      email: 'player@example.com',
      displayName: 'Player',
      password: 'secret12',
      confirmPassword: 'different',
    };
    expect(registerSchema.safeParse(sample).success).toBe(false);
  });

  it('accepts valid email-only values', () => {
    const sample: EmailOnlyFormValues = { email: 'player@example.com' };
    expect(emailOnlySchema.safeParse(sample).success).toBe(true);
  });

  it('accepts valid reset password values', () => {
    const sample: ResetPasswordFormValues = {
      password: 'secret12',
      confirmPassword: 'secret12',
    };
    expect(resetPasswordSchema.safeParse(sample).success).toBe(true);
  });
});
