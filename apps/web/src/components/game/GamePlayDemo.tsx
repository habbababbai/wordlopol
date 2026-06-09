import { evaluateGuess, MAX_GUESSES, WORD_LENGTH } from '@wordlopol/shared';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '../ui/button';
import { GameBoard, type GameBoardRow } from './GameBoard';
import { PolishKeyboard, type KeyState } from './PolishKeyboard';

const DEMO_ANSWER = 'ŚNIEG';

const keyStateRank: Record<KeyState, number> = {
  unused: 0,
  absent: 1,
  present: 2,
  correct: 3,
};

function createEmptyRows(): GameBoardRow[] {
  return Array.from({ length: MAX_GUESSES }, () => ({ letters: '' }));
}

function buildKeyStates(rows: GameBoardRow[]): Partial<Record<string, KeyState>> {
  const states: Partial<Record<string, KeyState>> = {};

  for (const row of rows) {
    if (!row.results) continue;

    for (let index = 0; index < row.letters.length; index++) {
      const letter = row.letters[index]?.toUpperCase();
      const result = row.results[index];
      if (!letter || !result) continue;

      const previous = states[letter] ?? 'unused';
      if (keyStateRank[result] > keyStateRank[previous]) {
        states[letter] = result;
      }
    }
  }

  return states;
}

function isGameWon(rows: GameBoardRow[]): boolean {
  return rows.some((row) => row.results?.every((result) => result === 'correct'));
}

function isGameFinished(rows: GameBoardRow[], activeRowIndex: number): boolean {
  if (isGameWon(rows)) return true;
  return activeRowIndex >= MAX_GUESSES;
}

export function GamePlayDemo() {
  const [rows, setRows] = useState<GameBoardRow[]>(createEmptyRows);
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [shakingRowIndex, setShakingRowIndex] = useState<number | null>(null);

  const finished = isGameFinished(rows, activeRowIndex);
  const keyStates = useMemo(() => buildKeyStates(rows), [rows]);

  const reset = useCallback(() => {
    setRows(createEmptyRows());
    setActiveRowIndex(0);
    setShakingRowIndex(null);
  }, []);

  const shakeActiveRow = useCallback(() => {
    setShakingRowIndex(activeRowIndex);
    window.setTimeout(() => setShakingRowIndex(null), 400);
  }, [activeRowIndex]);

  const submitGuess = useCallback(() => {
    const currentGuess = rows[activeRowIndex]?.letters ?? '';

    if (currentGuess.length < WORD_LENGTH) {
      shakeActiveRow();
      return;
    }

    const results = evaluateGuess(currentGuess, DEMO_ANSWER);
    const won = results.every((result) => result === 'correct');

    setRows((previous) => {
      const next = [...previous];
      next[activeRowIndex] = { letters: currentGuess, results };
      return next;
    });

    if (!won) {
      setActiveRowIndex((index) => index + 1);
    } else {
      setActiveRowIndex(MAX_GUESSES);
    }
  }, [activeRowIndex, rows, shakeActiveRow]);

  const handleInput = useCallback(
    (key: string) => {
      if (finished) return;

      if (key === 'Enter') {
        submitGuess();
        return;
      }

      if (key === 'Backspace') {
        setRows((previous) => {
          const next = [...previous];
          const current = next[activeRowIndex];
          if (!current || current.results) return previous;

          next[activeRowIndex] = {
            letters: current.letters.slice(0, -1),
          };
          return next;
        });
        return;
      }

      setRows((previous) => {
        const next = [...previous];
        const current = next[activeRowIndex];
        if (!current || current.results || current.letters.length >= WORD_LENGTH) {
          return previous;
        }

        next[activeRowIndex] = {
          letters: current.letters + key.toLowerCase(),
        };
        return next;
      });
    },
    [activeRowIndex, finished, submitGuess],
  );

  const statusMessage = finished
    ? isGameWon(rows)
      ? `Wygrana! Słowo: ${DEMO_ANSWER}`
      : `Koniec gry. Słowo: ${DEMO_ANSWER}`
    : `Demo — odgadnij słowo (${WORD_LENGTH} liter, ${MAX_GUESSES} prób)`;

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-center text-sm text-muted-foreground">{statusMessage}</p>
      <GameBoard rows={rows} activeRowIndex={activeRowIndex} shakingRowIndex={shakingRowIndex} />
      <PolishKeyboard onInput={handleInput} keyStates={keyStates} disabled={finished} />
      <Button type="button" size="sm" variant="outline" onClick={reset}>
        Resetuj demo
      </Button>
    </div>
  );
}
