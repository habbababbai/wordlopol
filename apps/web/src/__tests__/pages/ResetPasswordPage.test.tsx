import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { renderWithProviders } from '@/test/render';

const mutateAsyncMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.fn();

vi.mock('@/hooks/mutations/use-reset-password-mutation', () => ({
  useResetPasswordMutation: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('ResetPasswordPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mutateAsyncMock.mockReset();
    navigateMock.mockReset();
  });

  it('shows missing token error', () => {
    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password' });

    expect(screen.getByRole('heading', { level: 1, name: 'Nowe hasło' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Brak tokenu w linku');
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('shows password mismatch validation error', async () => {
    const user = userEvent.setup();

    renderWithProviders(<ResetPasswordPage />, {
      route: '/reset-password?token=valid-token',
    });

    await user.type(screen.getByLabelText('Nowe hasło'), 'secure-password');
    await user.type(screen.getByLabelText('Potwierdź hasło'), 'different-password');
    await user.click(screen.getByRole('button', { name: 'Ustaw nowe hasło' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Hasła nie są identyczne');
    });
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('resets password and redirects to login', async () => {
    const user = userEvent.setup();
    mutateAsyncMock.mockResolvedValueOnce({ message: 'Password reset' });

    renderWithProviders(<ResetPasswordPage />, {
      route: '/reset-password?token=valid-token',
    });

    await user.type(screen.getByLabelText('Nowe hasło'), 'secure-password');
    await user.type(screen.getByLabelText('Potwierdź hasło'), 'secure-password');
    await user.click(screen.getByRole('button', { name: 'Ustaw nowe hasło' }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        token: 'valid-token',
        password: 'secure-password',
      });
      expect(
        screen.getByText('Hasło zostało zmienione. Za chwilę przekierujemy do logowania.', {
          selector: '[data-slot="card-description"]',
        }),
      ).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(navigateMock).toHaveBeenCalledWith('/login');
      },
      { timeout: 3000 },
    );
  });
});
