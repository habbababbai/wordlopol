import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GameResultModal } from '@/components/game/GameResultModal';

afterEach(() => {
  cleanup();
});

describe('GameResultModal', () => {
  it('shows win title and home action for daily mode', () => {
    render(
      <GameResultModal open mode="daily" won guessNumber={3} answer="maksa" onGoHome={vi.fn()} />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Wygrana w 3. próbie!' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Strona główna' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Następne słowo' })).not.toBeInTheDocument();
  });

  it('shows loss copy and infinite actions', async () => {
    const user = userEvent.setup();
    const onGoHome = vi.fn();
    const onNextWord = vi.fn();

    render(
      <GameResultModal
        open
        mode="infinite"
        won={false}
        guessNumber={6}
        answer="maksa"
        onGoHome={onGoHome}
        onNextWord={onNextWord}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Koniec gry' })).toBeInTheDocument();
    expect(screen.getByText('Słowo: MAKSA')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Następne słowo' }));
    await user.click(screen.getByRole('button', { name: 'Strona główna' }));

    expect(onNextWord).toHaveBeenCalledTimes(1);
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });

  it('does not dismiss on Escape or backdrop click', async () => {
    const user = userEvent.setup();
    const onGoHome = vi.fn();

    render(
      <GameResultModal open mode="daily" won guessNumber={3} answer="maksa" onGoHome={onGoHome} />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onGoHome).not.toHaveBeenCalled();

    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).not.toBeNull();
    await user.click(overlay!);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onGoHome).not.toHaveBeenCalled();
  });
});

describe('getRowRevealDurationMs', () => {
  it('waits for the last tile flip to finish', async () => {
    const { getRowRevealDurationMs } = await import('@/lib/game-animation');
    expect(getRowRevealDurationMs(5)).toBe(900);
  });

  it('clamps invalid word lengths to one tile', async () => {
    const { getRowRevealDurationMs } = await import('@/lib/game-animation');
    expect(getRowRevealDurationMs(0)).toBe(500);
  });
});
