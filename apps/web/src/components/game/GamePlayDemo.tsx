import { evaluateGuess, MAX_GUESSES, WORD_LENGTH } from '@wordlopol/shared';
import { useCallback, useMemo, useState, useRef } from 'react';

import { useGameSounds } from '@/hooks/useGameSounds';
import { createEmptyRows, buildKeyStates, isGameFinished, isGameWon } from '@/lib/game-board';

import { Button } from '../ui/button';
import { GameBoard, type GameBoardRow } from './GameBoard';
import { PolishKeyboard } from './PolishKeyboard';

const DEMO_ANSWER = 'ŚNIEG';

export function GamePlayDemo() {
  const [rows, setRows] = useState<GameBoardRow[]>(createEmptyRows);
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [shakingRowIndex, setShakingRowIndex] = useState<number | null>(null);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { playType, playRevealSequence } = useGameSounds();

  const finished = isGameFinished(rows, activeRowIndex);
  const keyStates = useMemo(() => buildKeyStates(rows), [rows]);

  const reset = useCallback(() => {
    setRows(createEmptyRows());
    setActiveRowIndex(0);
    setShakingRowIndex(null);
    if (shakeTimeoutRef.current !== null) {
      clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = null;
    }
  }, []);

  const shakeActiveRow = useCallback(() => {
    if (shakeTimeoutRef.current !== null) {
      clearTimeout(shakeTimeoutRef.current);
    }
    setShakingRowIndex(activeRowIndex);
    shakeTimeoutRef.current = setTimeout(() => {
      setShakingRowIndex(null);
      shakeTimeoutRef.current = null;
    }, 400);
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
    playRevealSequence(results);

    if (!won) {
      setActiveRowIndex((index) => index + 1);
    } else {
      setActiveRowIndex(MAX_GUESSES);
    }
  }, [activeRowIndex, playRevealSequence, rows, shakeActiveRow]);

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
        playType();
        return next;
      });
    },
    [activeRowIndex, finished, playType, submitGuess],
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
