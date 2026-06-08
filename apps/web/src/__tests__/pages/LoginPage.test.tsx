import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/errors';
import { LoginPage } from '@/pages/LoginPage';
import { renderWithProviders } from '@/test/render';

const loginMock = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: loginMock,
    logout: vi.fn(),
  }),
}));

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('LoginPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    loginMock.mockReset();
    navigateMock.mockReset();
  });

  it('renders login fields', () => {
    renderWithProviders(<LoginPage />, { route: '/login' });

    expect(screen.getByRole('heading', { level: 1, name: 'Logowanie' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasło')).toBeInTheDocument();
  });

  it('submits credentials and navigates to returnTo', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValueOnce(undefined);

    renderWithProviders(<LoginPage />, { route: '/login?returnTo=%2Fprofile' });

    await user.type(screen.getByLabelText('E-mail'), 'player@example.com');
    await user.type(screen.getByLabelText('Hasło'), 'secure-password');
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('player@example.com', 'secure-password');
      expect(navigateMock).toHaveBeenCalledWith('/profile');
    });
  });

  it.each([
    { route: '/login', label: 'missing returnTo' },
    { route: '/login?returnTo=%2F%2Fevil.com', label: 'protocol-relative URL' },
    { route: '/login?returnTo=%2F%5Cevil.com', label: 'backslash bypass' },
    { route: '/login?returnTo=https%3A%2F%2Fevil.com', label: 'external URL' },
  ])('defaults to / when returnTo is invalid ($label)', async ({ route }) => {
    const user = userEvent.setup();
    loginMock.mockResolvedValueOnce(undefined);

    renderWithProviders(<LoginPage />, { route });

    await user.type(screen.getByLabelText('E-mail'), 'player@example.com');
    await user.type(screen.getByLabelText('Hasło'), 'secure-password');
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/');
    });
  });

  it('shows API error message', async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValueOnce(new ApiError(401, 'Invalid credentials'));

    renderWithProviders(<LoginPage />, { route: '/login' });

    await user.type(screen.getByLabelText('E-mail'), 'player@example.com');
    await user.type(screen.getByLabelText('Hasło'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });
});
