import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppLayout } from '@/components/layout/AppLayout';
import { renderWithProviders } from '@/test/render';

const mutateAsyncMock = vi.fn();

vi.mock('@/hooks/mutations/use-logout-mutation', () => ({
  useLogoutMutation: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';

const useAuthMock = vi.mocked(useAuth);

function renderAppLayout(route = '/') {
  return renderWithProviders(
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<div>Home</div>} />
      </Route>
    </Routes>,
    { route },
  );
}

describe('AppLayout', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mutateAsyncMock.mockReset();
    useAuthMock.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('renders nav links for main routes when logged out', () => {
    renderAppLayout();

    expect(screen.getByRole('link', { name: 'Wordlopol PL' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Dziennie' })).toHaveAttribute('href', '/daily');
    expect(screen.getByRole('link', { name: 'Nieskończony' })).toHaveAttribute('href', '/infinite');
    expect(screen.getByRole('link', { name: 'Profil' })).toHaveAttribute('href', '/profile');
    expect(screen.getByRole('link', { name: 'Zaloguj' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Ustawienia konta' })).toHaveAttribute(
      'href',
      '/settings',
    );
  });

  it('shows logout instead of login when authenticated', async () => {
    const user = userEvent.setup();
    mutateAsyncMock.mockResolvedValueOnce(undefined);
    useAuthMock.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'player@example.com',
        displayName: 'Player',
        emailVerified: true,
        stats: {
          dailyPlayed: 0,
          dailyWon: 0,
          infinitePlayed: 0,
          infiniteWon: 0,
          bestTimedWords: null,
          bestTimedMs: null,
          bestTimedWord: null,
        },
      },
      isAuthenticated: true,
      isLoading: false,
    });

    renderAppLayout();

    expect(screen.queryByRole('link', { name: 'Zaloguj' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Wyloguj' }));
    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
  });
});
