import express from 'express';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { signAccessToken } from '../lib/tokens.js';
import { authenticate } from '../middleware/authenticate.js';
import { optionalAuth } from '../middleware/optional-auth.js';
import { requireVerified } from '../middleware/require-verified.js';
import { expectApiError } from './helpers/expect-api-error.js';
import { createTestUser, resetDatabase } from '../test/helpers.js';

function buildMiddlewareApp() {
  const app = express();

  app.get('/strict', authenticate, (req, res) => {
    res.json({ userId: req.userId });
  });

  app.get('/optional', optionalAuth, (req, res) => {
    res.json({ userId: req.userId ?? null });
  });

  app.get('/verified', authenticate, requireVerified, (req, res) => {
    res.json({ userId: req.userId });
  });

  return app;
}

describe('auth middleware', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  describe('authenticate', () => {
    it('returns 401 without authorization header', async () => {
      const res = await request(buildMiddlewareApp()).get('/strict').expect(401);
      expect(res.body).toEqual(expectApiError('UNAUTHORIZED'));
    });

    it('returns 401 for invalid token', async () => {
      const res = await request(buildMiddlewareApp())
        .get('/strict')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body).toEqual(expectApiError('UNAUTHORIZED'));
    });

    it('attaches userId for valid token', async () => {
      const user = await createTestUser();
      const token = signAccessToken(user.id);

      const res = await request(buildMiddlewareApp())
        .get('/strict')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual({ userId: user.id });
    });
  });

  describe('optionalAuth', () => {
    it('allows anonymous requests', async () => {
      const res = await request(buildMiddlewareApp()).get('/optional').expect(200);
      expect(res.body).toEqual({ userId: null });
    });

    it('attaches userId when token is valid', async () => {
      const user = await createTestUser();
      const token = signAccessToken(user.id);

      const res = await request(buildMiddlewareApp())
        .get('/optional')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual({ userId: user.id });
    });

    it('ignores invalid tokens', async () => {
      const res = await request(buildMiddlewareApp())
        .get('/optional')
        .set('Authorization', 'Bearer invalid-token')
        .expect(200);

      expect(res.body).toEqual({ userId: null });
    });
  });

  describe('requireVerified', () => {
    it('returns 403 when email is not verified', async () => {
      const user = await createTestUser({ emailVerified: false });
      const token = signAccessToken(user.id);

      const res = await request(buildMiddlewareApp())
        .get('/verified')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body).toEqual(expectApiError('EMAIL_NOT_VERIFIED'));
    });

    it('allows verified users', async () => {
      const user = await createTestUser({ emailVerified: true });
      const token = signAccessToken(user.id);

      const res = await request(buildMiddlewareApp())
        .get('/verified')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual({ userId: user.id });
    });
  });
});
