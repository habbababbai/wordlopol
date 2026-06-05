import { Router } from 'express';
import { z } from 'zod';
import {
  AuthError,
  changePassword,
  deleteAccount,
  forgotPassword,
  login,
  logout,
  logoutAll,
  refreshSession,
  register,
  requestEmailChange,
  resendVerification,
  resetPassword,
  verifyEmail,
} from '../services/auth.js';
import { clearRefreshCookie, REFRESH_COOKIE_NAME, setRefreshCookie } from '../lib/tokens.js';
import { authenticate } from '../middleware/authenticate.js';
import {
  forgotPasswordRateLimit,
  loginRateLimit,
  registerRateLimit,
  resendVerificationRateLimit,
} from '../middleware/auth-rate-limit.js';

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

const emailOnlySchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const changeEmailSchema = z.object({
  newEmail: z.string().email(),
});

const deleteAccountSchema = z.object({
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
  registerRateLimit,
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
  loginRateLimit,
  handleAuthRoute(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const { accessToken, refreshToken } = await login(body);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken });
  }),
);

authRouter.post(
  '/refresh',
  handleAuthRoute(async (req, res) => {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;

    if (!refreshToken) {
      throw new AuthError(401, 'Missing refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } = await refreshSession(refreshToken);
    setRefreshCookie(res, newRefreshToken);
    res.json({ accessToken });
  }),
);

authRouter.post(
  '/logout',
  handleAuthRoute(async (req, res) => {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;
    await logout(refreshToken);
    clearRefreshCookie(res);
    res.json({ message: 'Logged out' });
  }),
);

authRouter.post(
  '/logout-all',
  authenticate,
  handleAuthRoute(async (req, res) => {
    await logoutAll(req.userId!);
    clearRefreshCookie(res);
    res.json({ message: 'Logged out from all devices' });
  }),
);

authRouter.post(
  '/forgot-password',
  forgotPasswordRateLimit,
  handleAuthRoute(async (req, res) => {
    const { email } = emailOnlySchema.parse(req.body);
    const result = await forgotPassword(email);
    res.json(result);
  }),
);

authRouter.post(
  '/resend-verification',
  resendVerificationRateLimit,
  handleAuthRoute(async (req, res) => {
    const { email } = emailOnlySchema.parse(req.body);
    const result = await resendVerification(email);
    res.json(result);
  }),
);

authRouter.post(
  '/reset-password',
  handleAuthRoute(async (req, res) => {
    const body = resetPasswordSchema.parse(req.body);
    const result = await resetPassword(body.token, body.password);
    res.json(result);
  }),
);

authRouter.patch(
  '/change-password',
  authenticate,
  handleAuthRoute(async (req, res) => {
    const body = changePasswordSchema.parse(req.body);
    const result = await changePassword(req.userId!, body.currentPassword, body.newPassword);
    clearRefreshCookie(res);
    res.json(result);
  }),
);

authRouter.patch(
  '/change-email',
  authenticate,
  handleAuthRoute(async (req, res) => {
    const { newEmail } = changeEmailSchema.parse(req.body);
    const result = await requestEmailChange(req.userId!, newEmail);
    res.json(result);
  }),
);

authRouter.delete(
  '/account',
  authenticate,
  handleAuthRoute(async (req, res) => {
    const { password } = deleteAccountSchema.parse(req.body);
    const result = await deleteAccount(req.userId!, password);
    clearRefreshCookie(res);
    res.json(result);
  }),
);
