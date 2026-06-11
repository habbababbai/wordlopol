import { Resend } from 'resend';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export function buildVerificationUrl(token: string): string {
  return `${env.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
}

export function buildPasswordResetUrl(token: string): string {
  return `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
}

export function buildEmailChangeUrl(token: string): string {
  return `${env.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
}

function isPlaceholderResendKey(key: string): boolean {
  return /x{4,}/i.test(key);
}

export function isEmailDeliveryConfigured(
  resendApiKey = env.RESEND_API_KEY,
  emailFrom = env.EMAIL_FROM,
): boolean {
  if (!resendApiKey || !emailFrom) {
    return false;
  }

  return !isPlaceholderResendKey(resendApiKey);
}

function logEmailLocally(to: string, subject: string, html: string): void {
  logger.info({ to, subject, html }, 'Email (local fallback)');
}

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }

  return resendClient;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!isEmailDeliveryConfigured()) {
    if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
      logEmailLocally(to, subject, html);
      return;
    }

    throw new Error('Email is not configured');
  }

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM!,
    to,
    subject,
    html,
  });

  if (error) {
    if (env.NODE_ENV === 'development') {
      logger.warn({ err: error.message }, 'Resend failed; logging email locally instead');
      logEmailLocally(to, subject, html);
      return;
    }

    throw new Error(error.message);
  }
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const url = buildVerificationUrl(token);

  await sendEmail(
    to,
    'Potwierdź adres e-mail — Wordlopol',
    `<p>Kliknij link, aby potwierdzić konto:</p><p><a href="${url}">${url}</a></p>`,
  );
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const url = buildPasswordResetUrl(token);

  await sendEmail(
    to,
    'Reset hasła — Wordlopol',
    `<p>Kliknij link, aby ustawić nowe hasło:</p><p><a href="${url}">${url}</a></p>`,
  );
}

export async function sendEmailChangeEmail(to: string, token: string): Promise<void> {
  const url = buildEmailChangeUrl(token);

  await sendEmail(
    to,
    'Potwierdź nowy adres e-mail — Wordlopol',
    `<p>Kliknij link, aby potwierdzić nowy adres e-mail:</p><p><a href="${url}">${url}</a></p>`,
  );
}
