import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Home } from '@/pages/Home';
import { renderWithProviders } from '@/test/render';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';

const useAuthMock = vi.mocked(useAuth);

describe('Home', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('renders hero, feature cards, and how-to-play section', () => {
    renderWithProviders(<Home />);

    expect(screen.getByRole('heading', { level: 1, name: 'Wordlopol' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Tryb dzienny' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Tryb nieskończony' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Statystyki' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Jak grać?' })).toBeInTheDocument();
  });

  it('shows guest prompts and locked infinite card when logged out', () => {
    renderWithProviders(<Home />);

    expect(screen.getByRole('link', { name: 'Zarejestruj się' })).toHaveAttribute(
      'href',
      '/register',
    );
    expect(screen.getByText('Zaloguj')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Graj dziś' })).toHaveAttribute('href', '/daily');
    expect(screen.getByRole('link', { name: 'Tryb nieskończony' })).toHaveAttribute(
      'href',
      '/login?returnTo=%2Finfinite',
    );
  });

  it('hides guest prompt and unlocks infinite links when logged in', () => {
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

    renderWithProviders(<Home />);

    expect(screen.queryByRole('link', { name: 'Zarejestruj się' })).not.toBeInTheDocument();
    expect(screen.queryByText('Zaloguj')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tryb nieskończony' })).toHaveAttribute(
      'href',
      '/infinite',
    );
    expect(screen.getByRole('link', { name: 'Zagraj' })).toHaveAttribute('href', '/infinite');
    expect(screen.getByRole('link', { name: 'Moje wyniki' })).toHaveAttribute('href', '/profile');
  });
});
