import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { renderWithProviders } from '@/test/render';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';

const useAuthMock = vi.mocked(useAuth);

function renderProtectedRoute(route = '/profile') {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<h1>Login redirect</h1>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<h1>Profile content</h1>} />
      </Route>
    </Routes>,
    { route },
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it('shows loading spinner while session is checked', () => {
    useAuthMock.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });

    renderProtectedRoute();

    expect(screen.getByRole('status', { name: 'Ładowanie' })).toBeInTheDocument();
  });

  it('redirects guests to login with returnTo', () => {
    useAuthMock.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    renderProtectedRoute('/profile');

    expect(screen.getByRole('heading', { level: 1, name: 'Login redirect' })).toBeInTheDocument();
  });

  it('renders child route for authenticated users', () => {
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

    renderProtectedRoute();

    expect(screen.getByRole('heading', { level: 1, name: 'Profile content' })).toBeInTheDocument();
  });
});
