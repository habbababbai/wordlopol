import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RequireVerifiedEmail } from '@/components/auth/RequireVerifiedEmail';
import { renderWithProviders } from '@/test/render';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';

const useAuthMock = vi.mocked(useAuth);

const verifiedUser = {
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
};

const unverifiedUser = {
  ...verifiedUser,
  emailVerified: false,
};

function renderRequireVerifiedEmail(route = '/infinite') {
  return renderWithProviders(
    <Routes>
      <Route element={<RequireVerifiedEmail />}>
        <Route path="/infinite" element={<h1>Infinite content</h1>} />
      </Route>
    </Routes>,
    { route },
  );
}

describe('RequireVerifiedEmail', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it('blocks unverified users with verification message', () => {
    useAuthMock.mockReturnValue({
      user: unverifiedUser,
      isAuthenticated: true,
      isLoading: false,
    });

    renderRequireVerifiedEmail();

    expect(
      screen.getByText('Potwierdź adres e-mail, aby korzystać z tej funkcji.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Przejdź do weryfikacji e-mail' })).toHaveAttribute(
      'href',
      '/verify-email',
    );
  });

  it('renders child route for verified users', () => {
    useAuthMock.mockReturnValue({
      user: verifiedUser,
      isAuthenticated: true,
      isLoading: false,
    });

    renderRequireVerifiedEmail();

    expect(screen.getByRole('heading', { level: 1, name: 'Infinite content' })).toBeInTheDocument();
  });
});
