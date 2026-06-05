import { Resend } from 'resend';
import { env } from '../config/env.js';

export function buildVerificationUrl(token: string): string {
  return `${env.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
}

export function buildPasswordResetUrl(token: string): string {
  return `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
}

export function buildEmailChangeUrl(token: string): string {
  return `${env.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
      console.info(`[email] To: ${to}\nSubject: ${subject}\n${html}`);
      return;
    }

    throw new Error('Email is not configured');
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
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
