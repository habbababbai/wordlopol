import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { VerifyEmailPage } from '@/pages/VerifyEmailPage';
import { renderWithProviders } from '@/test/render';

const verifyEmailOnceMock = vi.hoisted(() => vi.fn());
const resendMutateAsyncMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/mutations/use-verify-email-mutation', () => ({
  verifyEmailOnce: verifyEmailOnceMock,
  useVerifyEmailMutation: () => ({
    mutateAsync: verifyEmailOnceMock,
    isPending: false,
  }),
}));

vi.mock('@/hooks/mutations/use-resend-verification-mutation', () => ({
  useResendVerificationMutation: () => ({
    mutateAsync: resendMutateAsyncMock,
    isPending: false,
  }),
}));

describe('VerifyEmailPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    verifyEmailOnceMock.mockReset();
    resendMutateAsyncMock.mockReset();
  });

  it('auto-verifies when token is present', async () => {
    verifyEmailOnceMock.mockResolvedValueOnce(undefined);

    renderWithProviders(<VerifyEmailPage />, {
      route: '/verify-email?token=valid-token',
    });

    await waitFor(() => {
      expect(verifyEmailOnceMock).toHaveBeenCalledWith('valid-token');
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
    expect(verifyEmailOnceMock).not.toHaveBeenCalled();
  });

  it('submits resend verification form', async () => {
    const user = userEvent.setup();
    resendMutateAsyncMock.mockResolvedValueOnce({ message: 'Verification email sent' });

    renderWithProviders(<VerifyEmailPage />, { route: '/verify-email' });

    await user.type(screen.getByLabelText('E-mail'), 'player@example.com');
    await user.click(screen.getByRole('button', { name: 'Wyślij ponownie' }));

    await waitFor(() => {
      expect(resendMutateAsyncMock).toHaveBeenCalledWith({ email: 'player@example.com' });
      expect(
        screen.getByText('Jeśli konto istnieje, wysłaliśmy nowy link weryfikacyjny.'),
      ).toBeInTheDocument();
    });
  });
});
