import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/errors';
import { InfiniteGamePlay } from '@/components/game/InfiniteGamePlay';
import { renderWithProviders } from '@/test/render';

const mutateAsyncMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => vi.fn());
const onNextWordMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/mutations/use-infinite-guess-mutation', () => ({
  useInfiniteGuessMutation: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: toastMock, toasts: [], dismiss: vi.fn() }),
}));

const word = {
  date: '2026-06-09',
  wordNumber: 3,
  poolSize: 300,
  maxGuesses: 6,
  wordLength: 5,
};

async function typeWord(
  user: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
  guess: string,
) {
  for (const letter of guess) {
    await user.click(
      within(container).getByRole('button', { name: `Wpisz literę ${letter.toUpperCase()}` }),
    );
  }
}

afterEach(() => {
  cleanup();
});

describe('InfiniteGamePlay', () => {
  beforeEach(() => {
    mutateAsyncMock.mockReset();
    toastMock.mockReset();
    onNextWordMock.mockReset();
  });

  it('submits guess via mutation and updates the board', async () => {
    const user = userEvent.setup();
    mutateAsyncMock.mockResolvedValueOnce({
      results: ['present', 'absent', 'absent', 'absent', 'correct'],
      won: false,
      finished: false,
      guessNumber: 1,
    });

    const { container } = renderWithProviders(
      <InfiniteGamePlay word={word} onNextWord={onNextWordMock} />,
    );

    await typeWord(user, container, 'maksa');
    await user.click(within(container).getByRole('button', { name: 'Zatwierdź' }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({ guess: 'maksa' });
    });

    expect(within(container).getByRole('grid')).toBeInTheDocument();
  });

  it('shows result modal and disables keyboard on finish', async () => {
    const user = userEvent.setup();
    mutateAsyncMock.mockResolvedValueOnce({
      results: ['correct', 'correct', 'correct', 'correct', 'correct'],
      won: true,
      finished: true,
      guessNumber: 1,
      answer: 'maksa',
    });

    const { container } = renderWithProviders(
      <InfiniteGamePlay word={word} onNextWord={onNextWordMock} />,
    );

    await typeWord(user, container, 'maksa');
    await user.click(within(container).getByRole('button', { name: 'Zatwierdź' }));

    await waitFor(
      () => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Wygrana w 1. próbie!')).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    expect(within(container).queryByText(/Wygrana! Słowo: maksa/)).not.toBeInTheDocument();
    expect(
      within(container).getByRole('button', { name: 'Wpisz literę A', hidden: true }),
    ).toBeDisabled();
    expect(onNextWordMock).not.toHaveBeenCalled();
  });

  it('calls onNextWord from result modal', async () => {
    const user = userEvent.setup();
    mutateAsyncMock.mockResolvedValueOnce({
      results: ['correct', 'correct', 'correct', 'correct', 'correct'],
      won: true,
      finished: true,
      guessNumber: 1,
      answer: 'maksa',
    });

    const { container } = renderWithProviders(
      <InfiniteGamePlay word={word} onNextWord={onNextWordMock} />,
    );

    await typeWord(user, container, 'maksa');
    await user.click(within(container).getByRole('button', { name: 'Zatwierdź' }));

    await waitFor(
      () => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    await user.click(screen.getByRole('button', { name: 'Następne słowo' }));

    expect(onNextWordMock).toHaveBeenCalledTimes(1);
  });

  it('shows invalid-word toast on dictionary miss', async () => {
    const user = userEvent.setup();
    mutateAsyncMock.mockRejectedValueOnce(
      new ApiError(400, 'Not in dictionary', 'NOT_IN_DICTIONARY'),
    );

    const { container } = renderWithProviders(
      <InfiniteGamePlay word={word} onNextWord={onNextWordMock} />,
    );

    await typeWord(user, container, 'maksa');
    await user.click(within(container).getByRole('button', { name: 'Zatwierdź' }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith({
        message: 'Słowo nie znajduje się w słowniku.',
        variant: 'warning',
      });
    });
  });
});
