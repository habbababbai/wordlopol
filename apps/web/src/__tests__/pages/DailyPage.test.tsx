import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DailyPage } from '@/pages/DailyPage';
import { renderWithProviders } from '@/test/render';

const refetchMock = vi.fn();

vi.mock('@/hooks/queries/use-daily-today-query', () => ({
  useDailyTodayQuery: vi.fn(),
}));

import { useDailyTodayQuery } from '@/hooks/queries/use-daily-today-query';

const useDailyTodayQueryMock = vi.mocked(useDailyTodayQuery);

const challengeFixture = {
  date: '2026-06-09',
  maxGuesses: 6,
  wordLength: 5,
};

describe('DailyPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    useDailyTodayQueryMock.mockReset();
    refetchMock.mockReset();
  });

  it('shows loading state', () => {
    useDailyTodayQueryMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useDailyTodayQuery>);

    renderWithProviders(<DailyPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Wyzwanie dnia' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Ładowanie' })).toBeInTheDocument();
    expect(screen.getByText('Ładowanie wyzwania…')).toBeInTheDocument();
  });

  it('shows error state with retry', async () => {
    const user = userEvent.setup();
    useDailyTodayQueryMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useDailyTodayQuery>);

    renderWithProviders(<DailyPage />);

    expect(screen.getByText('Nie udało się wczytać wyzwania')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it('renders playable daily game when challenge loads', () => {
    useDailyTodayQueryMock.mockReturnValue({
      data: challengeFixture,
      isPending: false,
      isError: false,
      refetch: refetchMock,
    } as unknown as ReturnType<typeof useDailyTodayQuery>);

    renderWithProviders(<DailyPage />);

    expect(screen.getByText('Wyzwanie na 9 czerwca 2026')).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'Plansza gry' })).toBeInTheDocument();
    expect(screen.getByText('Odgadnij słowo na 5 liter (6 prób)')).toBeInTheDocument();
  });
});
