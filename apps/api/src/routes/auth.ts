import { Router } from 'express';
import cookieParser from 'cookie-parser';
import { z } from 'zod';

import { asyncHandler } from '../lib/async-handler.js';
import { displayNameSchema, normalizedEmailSchema } from '../lib/auth-schemas.js';
import { HttpError } from '../lib/http-error.js';
import { validateBody } from '../lib/validate-body.js';
import { clearRefreshCookie, REFRESH_COOKIE_NAME, setRefreshCookie } from '../lib/tokens.js';
import { authenticate } from '../middleware/authenticate.js';
import {
  authenticatedRateLimit,
  forgotPasswordRateLimit,
  loginRateLimit,
  refreshRateLimit,
  registerRateLimit,
  resendVerificationRateLimit,
  verifyEmailRateLimit,
} from '../middleware/auth-rate-limit.js';
import { csrfProtection, generateCsrfToken } from '../middleware/csrf.js';
import {
  changeDisplayName,
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

const registerSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().min(8),
  displayName: displayNameSchema,
});

const changeDisplayNameSchema = z.object({
  displayName: displayNameSchema,
});

const verifyEmailSchema = z.object({
  token: z.string().trim().min(1),
});

const loginSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().min(1),
});

const emailOnlySchema = z.object({
  email: normalizedEmailSchema,
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(8),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const changeEmailSchema = z.object({
  newEmail: normalizedEmailSchema,
});

const deleteAccountSchema = z.object({
  password: z.string().min(1),
});

export const authRouter: Router = Router();

authRouter.use(cookieParser());
authRouter.use(csrfProtection);

authRouter.get(
  '/csrf',
  asyncHandler(async (req, res) => {
    const csrfToken = generateCsrfToken(req, res);
    res.json({ csrfToken });
  }),
);

authRouter.post(
  '/register',
  registerRateLimit,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await register(req.body);
    res.status(201).json(result);
  }),
);

authRouter.post(
  '/verify-email',
  verifyEmailRateLimit,
  validateBody(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    const result = await verifyEmail(req.body.token);
    res.json(result);
  }),
);

authRouter.post(
  '/login',
  loginRateLimit,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const session = await login(req.body);
    setRefreshCookie(res, session.refreshToken);
    const csrfToken = generateCsrfToken(req, res, { overwrite: true });
    res.json({ accessToken: session.accessToken, user: session.user, csrfToken });
  }),
);

authRouter.post(
  '/refresh',
  refreshRateLimit,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;

    if (!refreshToken) {
      throw new HttpError(401, 'Missing refresh token');
    }

    const session = await refreshSession(refreshToken);
    setRefreshCookie(res, session.refreshToken);
    const csrfToken = generateCsrfToken(req, res, { overwrite: true });
    res.json({ accessToken: session.accessToken, csrfToken });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;
    await logout(refreshToken);
    clearRefreshCookie(res);
    res.json({ message: 'Logged out' });
  }),
);

authRouter.post(
  '/logout-all',
  authenticatedRateLimit,
  authenticate,
  asyncHandler(async (req, res) => {
    await logoutAll(req.userId!);
    clearRefreshCookie(res);
    res.json({ message: 'Logged out from all devices' });
  }),
);

authRouter.post(
  '/forgot-password',
  forgotPasswordRateLimit,
  validateBody(emailOnlySchema),
  asyncHandler(async (req, res) => {
    const result = await forgotPassword(req.body.email);
    res.json(result);
  }),
);

authRouter.post(
  '/resend-verification',
  resendVerificationRateLimit,
  validateBody(emailOnlySchema),
  asyncHandler(async (req, res) => {
    const result = await resendVerification(req.body.email);
    res.json(result);
  }),
);

authRouter.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const result = await resetPassword(req.body.token, req.body.password);
    res.json(result);
  }),
);

authRouter.patch(
  '/change-password',
  authenticatedRateLimit,
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const result = await changePassword(
      req.userId!,
      req.body.currentPassword,
      req.body.newPassword,
    );
    clearRefreshCookie(res);
    res.json(result);
  }),
);

authRouter.patch(
  '/change-email',
  authenticatedRateLimit,
  authenticate,
  validateBody(changeEmailSchema),
  asyncHandler(async (req, res) => {
    const result = await requestEmailChange(req.userId!, req.body.newEmail);
    res.json(result);
  }),
);

authRouter.patch(
  '/change-display-name',
  authenticatedRateLimit,
  authenticate,
  validateBody(changeDisplayNameSchema),
  asyncHandler(async (req, res) => {
    const result = await changeDisplayName(req.userId!, req.body.displayName);
    res.json(result);
  }),
);

authRouter.delete(
  '/account',
  authenticatedRateLimit,
  authenticate,
  validateBody(deleteAccountSchema),
  asyncHandler(async (req, res) => {
    const result = await deleteAccount(req.userId!, req.body.password);
    clearRefreshCookie(res);
    res.json(result);
  }),
);
