import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { renderWithProviders } from '@/test/render';

const mutateAsyncMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/mutations/use-forgot-password-mutation', () => ({
  useForgotPasswordMutation: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));

describe('ForgotPasswordPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mutateAsyncMock.mockReset();
  });

  it('renders email field', () => {
    renderWithProviders(<ForgotPasswordPage />, { route: '/forgot-password' });

    expect(screen.getByRole('heading', { level: 1, name: 'Przypomnij hasło' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
  });

  it('shows success message after submit', async () => {
    const user = userEvent.setup();
    mutateAsyncMock.mockResolvedValueOnce({
      message: 'If the email exists, instructions were sent',
    });

    renderWithProviders(<ForgotPasswordPage />, { route: '/forgot-password' });

    await user.type(screen.getByLabelText('E-mail'), 'player@example.com');
    await user.click(screen.getByRole('button', { name: 'Przypomnij hasło' }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({ email: 'player@example.com' });
      expect(
        screen.getByText('Jeśli konto istnieje, wysłaliśmy instrukcje resetu hasła.'),
      ).toBeInTheDocument();
    });
  });

  it('shows same success message for any successful API response', async () => {
    const user = userEvent.setup();
    mutateAsyncMock.mockResolvedValueOnce({ message: 'Different server message' });

    renderWithProviders(<ForgotPasswordPage />, { route: '/forgot-password' });

    await user.type(screen.getByLabelText('E-mail'), 'unknown@example.com');
    await user.click(screen.getByRole('button', { name: 'Przypomnij hasło' }));

    await waitFor(() => {
      expect(
        screen.getByText('Jeśli konto istnieje, wysłaliśmy instrukcje resetu hasła.'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('Different server message')).not.toBeInTheDocument();
  });
});
