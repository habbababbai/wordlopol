import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfilePage } from '@/pages/ProfilePage';
import { renderWithProviders } from '@/test/render';

const refetchMock = vi.fn();

vi.mock('@/hooks/queries/use-profile-query', () => ({
  useProfileQuery: vi.fn(),
}));

import { useProfileQuery } from '@/hooks/queries/use-profile-query';

const useProfileQueryMock = vi.mocked(useProfileQuery);

const profileFixture = {
  id: 'user-1',
  email: 'player@example.com',
  displayName: 'Gracz',
  emailVerified: true,
  stats: {
    dailyPlayed: 10,
    dailyWon: 7,
    infinitePlayed: 25,
    infiniteWon: 18,
    bestTimedWords: null,
    bestTimedMs: null,
    bestTimedWord: null,
  },
};

describe('ProfilePage', () => {
  beforeEach(() => {
    useProfileQueryMock.mockReset();
    refetchMock.mockReset();
  });

  it('shows loading state', () => {
    useProfileQueryMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useProfileQuery>);

    renderWithProviders(<ProfilePage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Profil' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Ładowanie' })).toBeInTheDocument();
    expect(screen.getByText('Ładowanie profilu…')).toBeInTheDocument();
  });

  it('shows error state with retry', async () => {
    const user = userEvent.setup();
    useProfileQueryMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useProfileQuery>);

    renderWithProviders(<ProfilePage />);

    expect(screen.getByText('Nie udało się wczytać profilu')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it('renders profile stats from query data', () => {
    useProfileQueryMock.mockReturnValue({
      data: profileFixture,
      isPending: false,
      isError: false,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useProfileQuery>);

    renderWithProviders(<ProfilePage />);

    expect(screen.getByText('Gracz')).toBeInTheDocument();
    expect(screen.getByText('player@example.com')).toBeInTheDocument();
    expect(screen.getByText('Zweryfikowany')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tryb dzienny' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tryb nieskończony' })).toBeInTheDocument();
    expect(screen.getAllByText('10')[0]).toBeInTheDocument();
    expect(screen.getAllByText('7')[0]).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getAllByText('25')[0]).toBeInTheDocument();
    expect(screen.getAllByText('18')[0]).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('shows verification link for unverified users', () => {
    useProfileQueryMock.mockReturnValue({
      data: { ...profileFixture, emailVerified: false },
      isPending: false,
      isError: false,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useProfileQuery>);

    renderWithProviders(<ProfilePage />);

    expect(screen.getByText('Niezweryfikowany')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Przejdź do weryfikacji e-mail' })).toHaveAttribute(
      'href',
      '/verify-email',
    );
  });
});
