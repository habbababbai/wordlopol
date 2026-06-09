import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'required').email('invalidEmail'),
  password: z.string().min(1, 'required'),
});

export const registerSchema = z
  .object({
    email: z.string().min(1, 'required').email('invalidEmail'),
    displayName: z.string().trim().min(1, 'required').max(50),
    password: z.string().min(8, 'passwordTooShort'),
    confirmPassword: z.string().min(1, 'required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  });

export const emailOnlySchema = z.object({
  email: z.string().min(1, 'required').email('invalidEmail'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'passwordTooShort'),
    confirmPassword: z.string().min(1, 'required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  });

export const changeDisplayNameSchema = z.object({
  displayName: z.string().trim().min(1, 'required').max(50),
});

export const changeEmailSchema = z.object({
  newEmail: z.string().min(1, 'required').email('invalidEmail'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'required'),
    newPassword: z.string().min(8, 'passwordTooShort'),
    confirmNewPassword: z.string().min(1, 'required'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'passwordMismatch',
    path: ['confirmNewPassword'],
  });

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'required'),
  confirmDeletion: z.boolean().refine((value) => value, {
    message: 'confirmationRequired',
  }),
});
