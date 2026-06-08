import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/errors';
import { RegisterPage } from '@/pages/RegisterPage';
import { renderWithProviders } from '@/test/render';

const mutateAsyncMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/mutations/use-register-mutation', () => ({
  useRegisterMutation: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));

describe('RegisterPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mutateAsyncMock.mockReset();
  });

  it('renders register fields', () => {
    renderWithProviders(<RegisterPage />, { route: '/register' });

    expect(screen.getByRole('heading', { level: 1, name: 'Rejestracja' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Nazwa wyświetlana')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasło')).toBeInTheDocument();
    expect(screen.getByLabelText('Potwierdź hasło')).toBeInTheDocument();
  });

  it('shows password mismatch validation error', async () => {
    const user = userEvent.setup();

    renderWithProviders(<RegisterPage />, { route: '/register' });

    await user.type(screen.getByLabelText('E-mail'), 'player@example.com');
    await user.type(screen.getByLabelText('Nazwa wyświetlana'), 'Player');
    await user.type(screen.getByLabelText('Hasło'), 'secure-password');
    await user.type(screen.getByLabelText('Potwierdź hasło'), 'different-password');
    await user.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Hasła nie są identyczne');
    });
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('shows success state after registration', async () => {
    const user = userEvent.setup();
    mutateAsyncMock.mockResolvedValueOnce({ message: 'Verification email sent' });

    renderWithProviders(<RegisterPage />, { route: '/register' });

    await user.type(screen.getByLabelText('E-mail'), 'player@example.com');
    await user.type(screen.getByLabelText('Nazwa wyświetlana'), 'Player');
    await user.type(screen.getByLabelText('Hasło'), 'secure-password');
    await user.type(screen.getByLabelText('Potwierdź hasło'), 'secure-password');
    await user.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        email: 'player@example.com',
        displayName: 'Player',
        password: 'secure-password',
      });
      expect(
        screen.getByRole('heading', { level: 1, name: 'Sprawdź skrzynkę e-mail' }),
      ).toBeInTheDocument();
    });
  });

  it('shows API error message', async () => {
    const user = userEvent.setup();
    mutateAsyncMock.mockRejectedValueOnce(new ApiError(409, 'Email already registered'));

    renderWithProviders(<RegisterPage />, { route: '/register' });

    await user.type(screen.getByLabelText('E-mail'), 'player@example.com');
    await user.type(screen.getByLabelText('Nazwa wyświetlana'), 'Player');
    await user.type(screen.getByLabelText('Hasło'), 'secure-password');
    await user.type(screen.getByLabelText('Potwierdź hasło'), 'secure-password');
    await user.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Email already registered');
    });
  });
});
