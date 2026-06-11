import { MAX_GUESSES, WORD_LENGTH, type LetterResult } from '@wordlopol/shared';

import { GameTile, type TileState } from '../GameTile';
import { cn } from '../../lib/utils';

export type GameBoardRow = {
  letters: string;
  results?: LetterResult[];
};

type GameBoardProps = {
  rows: GameBoardRow[];
  activeRowIndex: number;
  activeColIndex?: number;
  shakingRowIndex?: number | null;
  className?: string;
};

function normalizeRows(rows: GameBoardRow[]): GameBoardRow[] {
  const padded = [...rows];
  while (padded.length < MAX_GUESSES) {
    padded.push({ letters: '' });
  }
  return padded.slice(0, MAX_GUESSES);
}

function getSubmittedTileState(results: LetterResult[], colIndex: number): TileState {
  return results[colIndex] ?? 'absent';
}

function getActiveRowTileState(colIndex: number, letters: string, cursorCol: number): TileState {
  const hasLetter = colIndex < letters.length;

  if (hasLetter && colIndex !== cursorCol) {
    return 'filled';
  }

  if (colIndex === cursorCol) {
    return hasLetter ? 'filled' : 'active';
  }

  return 'empty';
}

function getTileState(
  rowIndex: number,
  colIndex: number,
  row: GameBoardRow,
  activeRowIndex: number,
  activeColIndex: number | undefined,
): TileState {
  if (row.results) {
    return getSubmittedTileState(row.results, colIndex);
  }

  if (rowIndex < activeRowIndex) {
    return row.letters[colIndex] ? 'filled' : 'empty';
  }

  if (rowIndex > activeRowIndex) {
    return 'empty';
  }

  const cursorCol = activeColIndex ?? (row.letters.length >= WORD_LENGTH ? -1 : row.letters.length);

  if (cursorCol === -1) {
    return colIndex < row.letters.length ? 'filled' : 'empty';
  }

  return getActiveRowTileState(colIndex, row.letters, cursorCol);
}

function getTileLetter(row: GameBoardRow, colIndex: number): string {
  return row.letters[colIndex]?.toUpperCase() ?? '';
}

export function GameBoard({
  rows,
  activeRowIndex,
  activeColIndex,
  shakingRowIndex = null,
  className,
}: GameBoardProps) {
  const boardRows = normalizeRows(rows);

  return (
    <div
      role="grid"
      aria-label="Plansza gry"
      aria-rowcount={MAX_GUESSES}
      aria-colcount={WORD_LENGTH}
      className={cn('flex flex-col gap-1 sm:gap-1.5', className)}
    >
      {boardRows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          role="row"
          aria-rowindex={rowIndex + 1}
          className={cn(
            'flex gap-1 sm:gap-1.5',
            shakingRowIndex === rowIndex && 'animate-row-shake',
          )}
        >
          {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
            const state = getTileState(rowIndex, colIndex, row, activeRowIndex, activeColIndex);
            const letter = getTileLetter(row, colIndex);
            const revealed = state === 'correct' || state === 'present' || state === 'absent';

            return (
              <div key={colIndex} role="gridcell" aria-colindex={colIndex + 1}>
                <GameTile letter={letter} state={state} delay={revealed ? colIndex * 0.1 : 0} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
