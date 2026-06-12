import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InfinitePage } from '@/pages/InfinitePage';
import { renderWithProviders } from '@/test/render';

const refetchMock = vi.fn();

vi.mock('@/hooks/queries/use-infinite-next-query', () => ({
  useInfiniteNextQuery: vi.fn(),
}));

import { useInfiniteNextQuery } from '@/hooks/queries/use-infinite-next-query';

const useInfiniteNextQueryMock = vi.mocked(useInfiniteNextQuery);

const wordFixture = {
  date: '2026-06-09',
  wordNumber: 3,
  poolSize: 300,
  maxGuesses: 6,
  wordLength: 5,
};

describe('InfinitePage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    useInfiniteNextQueryMock.mockReset();
    refetchMock.mockReset();
  });

  it('shows loading state', () => {
    useInfiniteNextQueryMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useInfiniteNextQuery>);

    renderWithProviders(<InfinitePage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Tryb nieskończony' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Ładowanie' })).toBeInTheDocument();
    expect(screen.getByText('Ładowanie słowa…')).toBeInTheDocument();
  });

  it('shows error state with retry', async () => {
    const user = userEvent.setup();
    useInfiniteNextQueryMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useInfiniteNextQuery>);

    renderWithProviders(<InfinitePage />);

    expect(screen.getByText('Nie udało się wczytać słowa')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it('renders playable infinite game when word loads', () => {
    useInfiniteNextQueryMock.mockReturnValue({
      data: wordFixture,
      isPending: false,
      isError: false,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useInfiniteNextQuery>);

    renderWithProviders(<InfinitePage />);

    expect(screen.getByText('9 czerwca 2026')).toBeInTheDocument();
    expect(
      screen.getByText('Gra bez limitu — odgaduj kolejne słowa z dzisiejszej puli.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Słowo 3 z 300')).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'Plansza gry' })).toBeInTheDocument();
    expect(screen.getByText('Próba 1 / 6')).toBeInTheDocument();
    expect(screen.getByText('Odgadnij słowo na 5 liter (6 prób)')).toBeInTheDocument();
  });
});
