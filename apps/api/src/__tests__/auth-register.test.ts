import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyAccessToken } from '../lib/tokens.js';
import { createTestAgent, resetDatabase } from '../test/helpers.js';

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

describe('auth register verify login', () => {
  beforeEach(async () => {
    verificationToken.value = '';
    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  it('registers, verifies email, and logs in', async () => {
    const agent = await createTestAgent();

    await agent
      .post('/auth/register')
      .send({
        email: 'player@example.com',
        password: 'secure-password',
        displayName: 'Player',
      })
      .expect(201)
      .expect({ message: 'Verification email sent' });

    expect(verificationToken.value).not.toBe('');

    await agent
      .post('/auth/verify-email')
      .send({ token: verificationToken.value })
      .expect(200)
      .expect({ message: 'Email verified' });

    const loginRes = await agent
      .post('/auth/login')
      .send({
        email: 'player@example.com',
        password: 'secure-password',
      })
      .expect(200);

    expect(loginRes.body.accessToken).toEqual(expect.any(String));
    expect(verifyAccessToken(loginRes.body.accessToken).userId).toEqual(expect.any(String));
    expect(loginRes.headers['set-cookie']?.[0]).toContain('refresh_token=');
  });

  it('rejects login before email verification', async () => {
    const agent = await createTestAgent();

    await agent.post('/auth/register').send({
      email: 'unverified@example.com',
      password: 'secure-password',
      displayName: 'Unverified Player',
    });

    const res = await agent.post('/auth/login').send({
      email: 'unverified@example.com',
      password: 'secure-password',
    });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Email not verified' });
  });

  it('resends verification email for unverified users', async () => {
    const agent = await createTestAgent();
    const email = 'resend@example.com';

    await agent
      .post('/auth/register')
      .send({ email, password: 'secure-password', displayName: 'Resend Player' });
    const firstToken = verificationToken.value;

    await agent
      .post('/auth/resend-verification')
      .send({ email })
      .expect(200)
      .expect({ message: 'If the email exists and is unverified, a verification link was sent' });

    expect(verificationToken.value).not.toBe(firstToken);

    await agent
      .post('/auth/verify-email')
      .send({ token: verificationToken.value })
      .expect(200)
      .expect({ message: 'Email verified' });
  });

  it('rejects duplicate registration', async () => {
    const agent = await createTestAgent();

    await agent.post('/auth/register').send({
      email: 'duplicate@example.com',
      password: 'secure-password',
      displayName: 'First Player',
    });

    const res = await agent.post('/auth/register').send({
      email: 'duplicate@example.com',
      password: 'another-password',
      displayName: 'Second Player',
    });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Email already registered' });
  });

  it('rejects registration without displayName', async () => {
    const agent = await createTestAgent();

    const res = await agent.post('/auth/register').send({
      email: 'noname@example.com',
      password: 'secure-password',
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid request' });
  });

  it('rejects registration with blank displayName', async () => {
    const agent = await createTestAgent();

    const res = await agent.post('/auth/register').send({
      email: 'blankname@example.com',
      password: 'secure-password',
      displayName: '   ',
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid request' });
  });
});
