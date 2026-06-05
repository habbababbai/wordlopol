import { afterEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null }),
);

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { env } from '../config/env.js';
import {
  buildEmailChangeUrl,
  buildPasswordResetUrl,
  buildVerificationUrl,
  isEmailDeliveryConfigured,
  sendVerificationEmail,
} from '../lib/email.js';

describe('email', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sendMock.mockClear();
  });

  describe('url builders', () => {
    it('builds verification url with encoded token', () => {
      expect(buildVerificationUrl('abc+def')).toBe(`${env.APP_URL}/verify-email?token=abc%2Bdef`);
    });

    it('builds password reset url with encoded token', () => {
      expect(buildPasswordResetUrl('reset token')).toBe(
        `${env.APP_URL}/reset-password?token=reset%20token`,
      );
    });

    it('builds email change url with encoded token', () => {
      expect(buildEmailChangeUrl('change token')).toBe(
        `${env.APP_URL}/verify-email?token=change%20token`,
      );
    });
  });

  describe('isEmailDeliveryConfigured', () => {
    it('treats placeholder resend keys as not configured', () => {
      expect(isEmailDeliveryConfigured('re_xxxxxxxx', 'auth@example.com')).toBe(false);
      expect(isEmailDeliveryConfigured('re_live_real_key', 'auth@example.com')).toBe(true);
      expect(isEmailDeliveryConfigured(undefined, 'auth@example.com')).toBe(false);
    });
  });

  describe('sendVerificationEmail', () => {
    it('uses resend when email is configured', async () => {
      if (!isEmailDeliveryConfigured()) {
        return;
      }

      await sendVerificationEmail('user@example.com', 'test-token');

      expect(sendMock).toHaveBeenCalledWith({
        from: env.EMAIL_FROM,
        to: 'user@example.com',
        subject: 'Potwierdź adres e-mail — Wordlopol',
        html: expect.stringContaining(encodeURIComponent('test-token')),
      });
    });

    it('logs instead of sending when email is not configured', async () => {
      if (isEmailDeliveryConfigured()) {
        return;
      }

      const info = vi.spyOn(console, 'info').mockImplementation(() => {});

      await sendVerificationEmail('user@example.com', 'test-token');

      expect(sendMock).not.toHaveBeenCalled();
      expect(info).toHaveBeenCalledOnce();
    });
  });
});
