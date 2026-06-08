import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { VerifyEmailPage } from '@/pages/VerifyEmailPage';
import { renderWithProviders } from '@/test/render';

const verifyEmailMock = vi.hoisted(() => vi.fn());
const resendVerificationMock = vi.hoisted(() => vi.fn());

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    api: {
      ...(actual.api as Record<string, unknown>),
      verifyEmail: verifyEmailMock,
      resendVerification: resendVerificationMock,
    },
  };
});

describe('VerifyEmailPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    verifyEmailMock.mockReset();
    resendVerificationMock.mockReset();
  });

  it('auto-verifies when token is present', async () => {
    verifyEmailMock.mockResolvedValueOnce({ message: 'Email verified' });

    renderWithProviders(<VerifyEmailPage />, {
      route: '/verify-email?token=valid-token',
    });

    await waitFor(() => {
      expect(verifyEmailMock).toHaveBeenCalledWith({ token: 'valid-token' });
      expect(
        screen.getByText('E-mail został potwierdzony. Możesz się zalogować.'),
      ).toBeInTheDocument();
    });
  });

  it('shows resend form when token is missing', () => {
    renderWithProviders(<VerifyEmailPage />, { route: '/verify-email' });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Weryfikacja e-mail' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(verifyEmailMock).not.toHaveBeenCalled();
  });

  it('submits resend verification form', async () => {
    const user = userEvent.setup();
    resendVerificationMock.mockResolvedValueOnce({ message: 'Verification email sent' });

    renderWithProviders(<VerifyEmailPage />, { route: '/verify-email' });

    await user.type(screen.getByLabelText('E-mail'), 'player@example.com');
    await user.click(screen.getByRole('button', { name: 'Wyślij ponownie' }));

    await waitFor(() => {
      expect(resendVerificationMock).toHaveBeenCalledWith({ email: 'player@example.com' });
      expect(
        screen.getByText('Jeśli konto istnieje, wysłaliśmy nowy link weryfikacyjny.'),
      ).toBeInTheDocument();
    });
  });
});
