import { Router } from 'express';
import { z } from 'zod';
import { AuthError, login, register, verifyEmail } from '../services/auth.js';
import { setRefreshCookie } from '../lib/tokens.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().trim().min(1).max(50).optional(),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function handleAuthRoute(
  handler: (req: import('express').Request, res: import('express').Response) => Promise<void>,
) {
  return async (req: import('express').Request, res: import('express').Response) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request' });
        return;
      }

      if (error instanceof AuthError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      throw error;
    }
  };
}

export const authRouter: Router = Router();

authRouter.post(
  '/register',
  handleAuthRoute(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const result = await register(body);
    res.status(201).json(result);
  }),
);

authRouter.post(
  '/verify-email',
  handleAuthRoute(async (req, res) => {
    const { token } = verifyEmailSchema.parse(req.body);
    const result = await verifyEmail(token);
    res.json(result);
  }),
);

authRouter.post(
  '/login',
  handleAuthRoute(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const { accessToken, refreshToken } = await login(body);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken });
  }),
);
