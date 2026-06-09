import type { LetterResult } from '@wordlopol/shared';
import { cleanup, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { GameBoard } from '@/components/game/GameBoard';

const emptyRows = Array.from({ length: 6 }, () => ({ letters: '' }));

function renderBoard(props: Partial<ComponentProps<typeof GameBoard>> = {}) {
  return render(<GameBoard rows={emptyRows} activeRowIndex={0} {...props} />);
}

function getRows(container: HTMLElement) {
  return within(container).getAllByRole('row');
}

afterEach(() => {
  cleanup();
});

describe('GameBoard', () => {
  it('renders a 6x5 grid', () => {
    const { container } = renderBoard();

    expect(screen.getByRole('grid', { name: 'Plansza gry' })).toBeInTheDocument();
    expect(getRows(container)).toHaveLength(6);
    expect(within(container).getAllByRole('gridcell')).toHaveLength(30);
  });

  it('shows submitted row results with letters', () => {
    const rows = [
      {
        letters: 'skala',
        results: ['correct', 'present', 'absent', 'absent', 'correct'] satisfies LetterResult[],
      },
      ...emptyRows.slice(1),
    ];

    const { container } = renderBoard({ rows, activeRowIndex: 1 });
    const firstRow = getRows(container)[0]!;

    expect(within(firstRow).getByText('S')).toBeInTheDocument();
    expect(within(firstRow).getByText('K')).toBeInTheDocument();
    expect(within(firstRow).getByText('L')).toBeInTheDocument();
    expect(within(firstRow).getAllByText('A')).toHaveLength(2);

    const tiles = within(firstRow).getAllByRole('gridcell');
    expect(tiles[0]?.firstChild).toHaveClass('bg-(--tile-correct)');
    expect(tiles[1]?.firstChild).toHaveClass('bg-(--tile-present)');
    expect(tiles[2]?.firstChild).toHaveClass('bg-(--tile-absent)');
    expect(tiles[4]?.firstChild).toHaveClass('bg-(--tile-correct)');
    expect(tiles[0]?.firstChild).toHaveClass('animate-tile-flip');
  });

  it('shows filled and active tiles on the current row', () => {
    const rows = [{ letters: 'sk' }, ...emptyRows.slice(1)];

    const { container } = renderBoard({ rows, activeRowIndex: 0 });
    const activeRow = getRows(container)[0]!;
    const tiles = within(activeRow).getAllByRole('gridcell');

    expect(tiles[0]?.firstChild).toHaveClass('border-[var(--tile-filled-border)]');
    expect(tiles[1]?.firstChild).toHaveClass('border-[var(--tile-filled-border)]');
    expect(tiles[2]?.firstChild).toHaveClass('border-[var(--tile-active-border)]');
    expect(tiles[3]?.firstChild).toHaveClass('border-[var(--tile-empty-border)]');
  });

  it('applies shake animation to the shaking row', () => {
    const rows = [{ letters: 'skala' }, ...emptyRows.slice(1)];

    const { container, rerender } = renderBoard({
      rows,
      activeRowIndex: 0,
      shakingRowIndex: null,
    });

    const firstRow = getRows(container)[0]!;
    expect(firstRow).not.toHaveClass('animate-row-shake');

    rerender(<GameBoard rows={rows} activeRowIndex={0} shakingRowIndex={0} />);

    expect(getRows(container)[0]).toHaveClass('animate-row-shake');
  });
});
