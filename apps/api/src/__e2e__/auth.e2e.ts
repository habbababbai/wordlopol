import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { verifyAccessToken } from '../lib/tokens.js';
import { apiPath, resetDatabase } from '../test/helpers.js';
import { baseUrl } from './server.js';

const verificationToken = vi.hoisted(() => ({ value: '' }));

vi.mock('../lib/email.js', () => ({
  sendVerificationEmail: vi.fn(async (_to: string, token: string) => {
    verificationToken.value = token;
  }),
  sendPasswordResetEmail: vi.fn(),
  sendEmailChangeEmail: vi.fn(),
  buildVerificationUrl: vi.fn(),
  buildPasswordResetUrl: vi.fn(),
  buildEmailChangeUrl: vi.fn(),
}));

describe('e2e: auth flow', () => {
  beforeEach(async () => {
    verificationToken.value = '';
    await resetDatabase();
  });

  it('registers, verifies, logs in, and refreshes over real http', async () => {
    const agent = request.agent(baseUrl);

    await agent
      .post(apiPath('/auth/register'))
      .send({
        email: 'e2e-player@example.com',
        password: 'secure-password',
        displayName: 'E2E Player',
      })
      .expect(201);

    expect(verificationToken.value).not.toBe('');

    await agent
      .post(apiPath('/auth/verify-email'))
      .send({ token: verificationToken.value })
      .expect(200)
      .expect({ message: 'Email verified' });

    const loginRes = await agent
      .post(apiPath('/auth/login'))
      .send({
        email: 'e2e-player@example.com',
        password: 'secure-password',
      })
      .expect(200);

    expect(verifyAccessToken(loginRes.body.accessToken).userId).toEqual(expect.any(String));
    expect(loginRes.body.refreshToken).toBeUndefined();
    expect(loginRes.body.user).toEqual({
      id: expect.any(String),
      email: 'e2e-player@example.com',
      displayName: 'E2E Player',
      emailVerified: true,
    });
    expect(loginRes.headers['set-cookie']?.[0]).toContain('refresh_token=');

    const refreshRes = await agent.post(apiPath('/auth/refresh')).expect(200);

    expect(refreshRes.body.accessToken).toEqual(expect.any(String));
    expect(refreshRes.body.refreshToken).toBeUndefined();
    expect(refreshRes.headers['set-cookie']?.[0]).toContain('refresh_token=');
  });
});
