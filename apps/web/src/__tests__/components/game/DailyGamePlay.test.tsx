import { cleanup, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/errors';
import { DailyGamePlay } from '@/components/game/DailyGamePlay';
import {
  resetDailyFinishedStore,
  saveDailyAlreadyPlayed,
  saveDailyFinished,
} from '@/stores/daily-finished-store';
import { renderWithProviders } from '@/test/render';

const mutateAsyncMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/mutations/use-daily-guess-mutation', () => ({
  useDailyGuessMutation: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: toastMock, toasts: [], dismiss: vi.fn() }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  })),
}));

import { useAuth } from '@/hooks/useAuth';

const useAuthMock = vi.mocked(useAuth);

const challenge = {
  date: '2026-06-09',
  maxGuesses: 6,
  wordLength: 5,
};

async function typeWord(
  user: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
  word: string,
) {
  for (const letter of word) {
    await user.click(
      within(container).getByRole('button', { name: `Wpisz literę ${letter.toUpperCase()}` }),
    );
  }
}

afterEach(() => {
  cleanup();
});

describe('DailyGamePlay', () => {
  beforeEach(() => {
    mutateAsyncMock.mockReset();
    toastMock.mockReset();
    useAuthMock.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    resetDailyFinishedStore();
  });

  it('submits guest guess and updates the board', async () => {
    const user = userEvent.setup();
    mutateAsyncMock.mockResolvedValueOnce({
      results: ['present', 'absent', 'absent', 'absent', 'correct'],
      won: false,
      finished: false,
      guessNumber: 1,
    });

    const { container } = renderWithProviders(<DailyGamePlay challenge={challenge} />);

    await typeWord(user, container, 'maksa');
    await user.click(within(container).getByRole('button', { name: 'Zatwierdź' }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({ guess: 'maksa' });
    });

    expect(within(container).getByRole('grid')).toBeInTheDocument();
  });

  it('disables keyboard when loaded from completed cache', () => {
    saveDailyFinished({
      date: challenge.date,
      status: 'completed',
      rows: [
        {
          letters: 'maksa',
          results: ['correct', 'correct', 'correct', 'correct', 'correct'],
        },
      ],
      won: true,
      answer: 'maksa',
    });

    const { container } = renderWithProviders(<DailyGamePlay challenge={challenge} />);

    expect(within(container).getByRole('button', { name: 'Wpisz literę A' })).toBeDisabled();
    expect(within(container).getByText(/Wygrana! Słowo: maksa/)).toBeInTheDocument();
  });

  it('shows already-played screen when loaded from cache', () => {
    saveDailyAlreadyPlayed(challenge.date);

    const { container } = renderWithProviders(<DailyGamePlay challenge={challenge} />);

    expect(within(container).getByText('Już rozwiązałeś dzisiejsze wyzwanie.')).toBeInTheDocument();
    expect(within(container).queryByRole('grid')).not.toBeInTheDocument();
    expect(within(container).getByRole('button', { name: 'Wpisz literę A' })).toBeDisabled();
  });

  it('handles 409 by switching to already-played screen and caching state', async () => {
    const user = userEvent.setup();
    mutateAsyncMock.mockRejectedValueOnce(
      new ApiError(409, 'Already played today', 'ALREADY_PLAYED_TODAY'),
    );

    const { container } = renderWithProviders(<DailyGamePlay challenge={challenge} />);

    await typeWord(user, container, 'maksa');
    await user.click(within(container).getByRole('button', { name: 'Zatwierdź' }));

    await waitFor(() => {
      expect(
        within(container).getByText('Już rozwiązałeś dzisiejsze wyzwanie.'),
      ).toBeInTheDocument();
    });

    expect(within(container).queryByRole('grid')).not.toBeInTheDocument();
  });

  it('submits guess for authenticated users', async () => {
    const user = userEvent.setup();
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
    mutateAsyncMock.mockResolvedValueOnce({
      results: ['absent', 'absent', 'absent', 'absent', 'absent'],
      won: false,
      finished: false,
      guessNumber: 1,
    });

    const { container } = renderWithProviders(<DailyGamePlay challenge={challenge} />);

    await typeWord(user, container, 'maksa');
    await user.click(within(container).getByRole('button', { name: 'Zatwierdź' }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({ guess: 'maksa' });
    });
  });

  it('reinitializes when challenge date changes', () => {
    saveDailyAlreadyPlayed(challenge.date);

    const { container, rerender } = renderWithProviders(<DailyGamePlay challenge={challenge} />);

    expect(within(container).getByText('Już rozwiązałeś dzisiejsze wyzwanie.')).toBeInTheDocument();

    const nextChallenge = { ...challenge, date: '2026-06-10' };
    rerender(<DailyGamePlay key={nextChallenge.date} challenge={nextChallenge} />);

    expect(
      within(container).queryByText('Już rozwiązałeś dzisiejsze wyzwanie.'),
    ).not.toBeInTheDocument();
    expect(within(container).getByRole('grid', { name: 'Plansza gry' })).toBeInTheDocument();
    expect(within(container).getByRole('button', { name: 'Wpisz literę A' })).not.toBeDisabled();
  });
});
