import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { renderWithProviders } from '@/test/render';

const forgotPasswordMock = vi.hoisted(() => vi.fn());

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    api: {
      ...(actual.api as Record<string, unknown>),
      forgotPassword: forgotPasswordMock,
    },
  };
});

describe('ForgotPasswordPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    forgotPasswordMock.mockReset();
  });

  it('renders email field', () => {
    renderWithProviders(<ForgotPasswordPage />, { route: '/forgot-password' });

    expect(screen.getByRole('heading', { level: 1, name: 'Przypomnij hasło' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
  });

  it('shows success message after submit', async () => {
    const user = userEvent.setup();
    forgotPasswordMock.mockResolvedValueOnce({
      message: 'If the email exists, instructions were sent',
    });

    renderWithProviders(<ForgotPasswordPage />, { route: '/forgot-password' });

    await user.type(screen.getByLabelText('E-mail'), 'player@example.com');
    await user.click(screen.getByRole('button', { name: 'Przypomnij hasło' }));

    await waitFor(() => {
      expect(forgotPasswordMock).toHaveBeenCalledWith({ email: 'player@example.com' });
      expect(
        screen.getByText('Jeśli konto istnieje, wysłaliśmy instrukcje resetu hasła.'),
      ).toBeInTheDocument();
    });
  });

  it('shows same success message for any successful API response', async () => {
    const user = userEvent.setup();
    forgotPasswordMock.mockResolvedValueOnce({ message: 'Different server message' });

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
