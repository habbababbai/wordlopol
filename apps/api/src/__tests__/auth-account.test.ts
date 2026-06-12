import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma.js';
import { signAccessToken } from '@/lib/tokens.js';
import { expectApiError } from './helpers/expect-api-error.js';
import {
  apiPath,
  createTestAgent,
  createVerifiedUserWithPassword,
  resetDatabase,
} from '@/test/helpers.js';

const passwordResetToken = vi.hoisted(() => ({ value: '' }));
const emailChangeToken = vi.hoisted(() => ({ value: '' }));

vi.mock('@/lib/email.js', () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(async (_to: string, token: string) => {
    passwordResetToken.value = token;
  }),
  sendEmailChangeEmail: vi.fn(async (_to: string, token: string) => {
    emailChangeToken.value = token;
  }),
  buildVerificationUrl: vi.fn(),
  buildPasswordResetUrl: vi.fn(),
  buildEmailChangeUrl: vi.fn(),
}));

describe('auth account endpoints', () => {
  beforeEach(async () => {
    passwordResetToken.value = '';
    emailChangeToken.value = '';
    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  it('resets password and revokes refresh sessions', async () => {
    const { user, password } = await createVerifiedUserWithPassword('old-password');
    const agent = await createTestAgent();

    await agent.post(apiPath('/auth/login')).send({ email: user.email, password });

    await agent.post(apiPath('/auth/forgot-password')).send({ email: user.email }).expect(200);

    expect(passwordResetToken.value).not.toBe('');

    await agent
      .post(apiPath('/auth/reset-password'))
      .send({ token: passwordResetToken.value, password: 'new-password-1' })
      .expect(200)
      .expect({ message: 'Password reset' });

    expect((await agent.post(apiPath('/auth/refresh'))).status).toBe(401);

    await agent
      .post(apiPath('/auth/login'))
      .send({ email: user.email, password: 'new-password-1' })
      .expect(200);
  });

  it('change-password revokes refresh sessions', async () => {
    const { user, password } = await createVerifiedUserWithPassword('old-password');
    const agent = await createTestAgent();

    await agent.post(apiPath('/auth/login')).send({ email: user.email, password });

    await agent
      .patch(apiPath('/auth/change-password'))
      .set('Authorization', `Bearer ${signAccessToken(user.id, true)}`)
      .send({ currentPassword: 'old-password', newPassword: 'new-password-2' })
      .expect(200)
      .expect({ message: 'Password changed' });

    expect((await agent.post(apiPath('/auth/refresh'))).status).toBe(401);
  });

  it('changes email after verification token is confirmed', async () => {
    const { user, password } = await createVerifiedUserWithPassword();
    const agent = await createTestAgent();
    const newEmail = 'new-address@example.com';

    await agent
      .patch(apiPath('/auth/change-email'))
      .set('Authorization', `Bearer ${signAccessToken(user.id, true)}`)
      .send({ newEmail })
      .expect(200)
      .expect({ message: 'Verification email sent' });

    expect(emailChangeToken.value).not.toBe('');

    await agent
      .post(apiPath('/auth/verify-email'))
      .send({ token: emailChangeToken.value })
      .expect(200)
      .expect({ message: 'Email changed' });

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.email).toBe(newEmail);

    await agent.post(apiPath('/auth/login')).send({ email: newEmail, password }).expect(200);
  });

  it('deletes account with password confirmation', async () => {
    const { user, password } = await createVerifiedUserWithPassword();
    const agent = await createTestAgent();

    await agent
      .delete(apiPath('/auth/account'))
      .set('Authorization', `Bearer ${signAccessToken(user.id, true)}`)
      .send({ password })
      .expect(200)
      .expect({ message: 'Account deleted' });

    const deleted = await prisma.user.findUnique({ where: { id: user.id } });
    expect(deleted).toBeNull();
  });

  it('changes display name', async () => {
    const { user } = await createVerifiedUserWithPassword();

    const res = await (
      await createTestAgent()
    )
      .patch(apiPath('/auth/change-display-name'))
      .set('Authorization', `Bearer ${signAccessToken(user.id, true)}`)
      .send({ displayName: 'New Name' })
      .expect(200);

    expect(res.body.user).toEqual({
      id: user.id,
      email: user.email,
      displayName: 'New Name',
      emailVerified: true,
    });

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.displayName).toBe('New Name');
  });

  it('rejects unchanged display name', async () => {
    const { user } = await createVerifiedUserWithPassword();

    const res = await (
      await createTestAgent()
    )
      .patch(apiPath('/auth/change-display-name'))
      .set('Authorization', `Bearer ${signAccessToken(user.id, true)}`)
      .send({ displayName: 'Test Player' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(expectApiError('DISPLAY_NAME_UNCHANGED'));
  });

  it('rejects blank display name', async () => {
    const { user } = await createVerifiedUserWithPassword();

    const res = await (
      await createTestAgent()
    )
      .patch(apiPath('/auth/change-display-name'))
      .set('Authorization', `Bearer ${signAccessToken(user.id, true)}`)
      .send({ displayName: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(expectApiError('VALIDATION_ERROR'));
  });
});
