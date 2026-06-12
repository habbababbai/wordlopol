import { afterEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null }),
);
const resendConstructor = vi.hoisted(() => vi.fn());

vi.mock('resend', () => ({
  Resend: class {
    constructor(...args: unknown[]) {
      resendConstructor(...args);
    }

    emails = { send: sendMock };
  },
}));

import { env } from '@/config/env.js';
import * as email from '@/lib/email.js';

describe('email', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sendMock.mockClear();
    resendConstructor.mockClear();
  });

  describe('url builders', () => {
    it('builds verification url with encoded token', () => {
      expect(email.buildVerificationUrl('abc+def')).toBe(
        `${env.APP_URL}/verify-email?token=abc%2Bdef`,
      );
    });

    it('builds password reset url with encoded token', () => {
      expect(email.buildPasswordResetUrl('reset token')).toBe(
        `${env.APP_URL}/reset-password?token=reset%20token`,
      );
    });

    it('builds email change url with encoded token', () => {
      expect(email.buildEmailChangeUrl('change token')).toBe(
        `${env.APP_URL}/verify-email?token=change%20token`,
      );
    });
  });

  describe('isEmailDeliveryConfigured', () => {
    it('treats placeholder resend keys as not configured', () => {
      expect(email.isEmailDeliveryConfigured('re_xxxxxxxx', 'auth@example.com')).toBe(false);
      expect(email.isEmailDeliveryConfigured('re_live_real_key', 'auth@example.com')).toBe(true);
      expect(email.isEmailDeliveryConfigured(undefined, 'auth@example.com')).toBe(false);
    });
  });

  describe('sendVerificationEmail', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    it('uses resend when email is configured', async () => {
      vi.stubEnv('RESEND_API_KEY', 're_live_real_key');
      vi.stubEnv('EMAIL_FROM', 'auth@example.com');
      vi.resetModules();
      sendMock.mockClear();

      const { sendVerificationEmail } = await import('@/lib/email.js');

      await sendVerificationEmail('user@example.com', 'test-token');

      expect(sendMock).toHaveBeenCalledWith({
        from: 'auth@example.com',
        to: 'user@example.com',
        subject: 'Potwierdź adres e-mail — Wordlopol',
        html: expect.stringContaining(encodeURIComponent('test-token')),
      });
    });

    it('reuses a single Resend client across sends', async () => {
      vi.stubEnv('RESEND_API_KEY', 're_live_real_key');
      vi.stubEnv('EMAIL_FROM', 'auth@example.com');
      vi.resetModules();
      sendMock.mockClear();
      resendConstructor.mockClear();

      const { sendVerificationEmail, sendPasswordResetEmail } = await import('@/lib/email.js');

      await sendVerificationEmail('user@example.com', 'verify-token');
      await sendPasswordResetEmail('user@example.com', 'reset-token');

      expect(resendConstructor).toHaveBeenCalledOnce();
      expect(sendMock).toHaveBeenCalledTimes(2);
    });

    it('logs instead of sending when email is not configured', async () => {
      vi.stubEnv('RESEND_API_KEY', 're_xxxxxxxx');
      vi.stubEnv('EMAIL_FROM', 'auth@example.com');
      vi.resetModules();
      sendMock.mockClear();

      const { sendVerificationEmail } = await import('@/lib/email.js');
      const { logger } = await import('@/lib/logger.js');
      const info = vi.spyOn(logger, 'info').mockImplementation(() => {});

      await sendVerificationEmail('user@example.com', 'test-token');

      expect(sendMock).not.toHaveBeenCalled();
      expect(info).toHaveBeenCalledOnce();
    });
  });
});
