import { z } from 'zod';

import { normalizeEmail } from './normalize-email.js';

export const normalizedEmailSchema = z
  .string()
  .trim()
  .transform(normalizeEmail)
  .pipe(z.string().email());

export const displayNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .regex(/^[\p{L}\p{N} -]+$/u);
