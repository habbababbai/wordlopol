import type { GuessResultDto, InfiniteWordDto } from '@wordlopol/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ApiError } from '@/api/errors';
import { authKeys } from '@/api/query-keys';
import { Button } from '@/components/ui/button';
import { useInfiniteGuessMutation } from '@/hooks/mutations/use-infinite-guess-mutation';
import { useGameKeyboard } from '@/hooks/useGameKeyboard';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { buildKeyStates, createEmptyRows } from '@/lib/game-board';

import { GameBoard, type GameBoardRow } from './GameBoard';
import { GameStatusBar } from './GameStatusBar';
import { PolishKeyboard } from './PolishKeyboard';

type PlayMode = 'playing' | 'wordCompleted';

type InfiniteGamePlayProps = {
  word: InfiniteWordDto;
  onNextWord: () => void;
};

export function InfiniteGamePlay({ word, onNextWord }: InfiniteGamePlayProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const guessMutation = useInfiniteGuessMutation();

  const [mode, setMode] = useState<PlayMode>('playing');
  const [rows, setRows] = useState<GameBoardRow[]>(() => createEmptyRows());
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [shakingRowIndex, setShakingRowIndex] = useState<number | null>(null);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locked = mode !== 'playing' || guessMutation.isPending;
  const keyStates = useMemo(() => buildKeyStates(rows), [rows]);

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

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current !== null) {
        clearTimeout(shakeTimeoutRef.current);
        shakeTimeoutRef.current = null;
      }
      setShakingRowIndex(null);
    };
  }, []);

  const submitGuess = useCallback(async () => {
    if (mode !== 'playing' || guessMutation.isPending) return;

    const currentGuess = rows[activeRowIndex]?.letters ?? '';
    if (currentGuess.length < word.wordLength) {
      shakeActiveRow();
      return;
    }

    try {
      const result: GuessResultDto = await guessMutation.mutateAsync({ guess: currentGuess });

      const nextRows = [...rows];
      nextRows[activeRowIndex] = { letters: currentGuess, results: result.results };
      setRows(nextRows);

      if (result.won) {
        setActiveRowIndex(word.maxGuesses);
      } else if (!result.finished) {
        setActiveRowIndex((index) => index + 1);
      } else {
        setActiveRowIndex(word.maxGuesses);
      }

      if (result.finished) {
        const finishedAnswer = result.answer;
        if (finishedAnswer !== undefined) {
          setAnswer(finishedAnswer);
          setWon(result.won);
          setMode('wordCompleted');
          void queryClient.invalidateQueries({ queryKey: authKeys.profile() });
        }
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NOT_IN_DICTIONARY') {
        toast({ message: t('pages.infinite.play.invalidWord'), variant: 'warning' });
        return;
      }

      toast({
        message: getApiErrorMessage(error, t('common.errors.generic')),
        variant: 'error',
      });
    }
  }, [
    activeRowIndex,
    guessMutation,
    mode,
    queryClient,
    rows,
    shakeActiveRow,
    t,
    toast,
    word.maxGuesses,
    word.wordLength,
  ]);

  const handleInput = useCallback(
    (key: string) => {
      if (locked) return;

      if (key === 'Enter') {
        void submitGuess();
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
        if (!current || current.results || current.letters.length >= word.wordLength) {
          return previous;
        }

        next[activeRowIndex] = {
          letters: current.letters + key.toLowerCase(),
        };
        return next;
      });
    },
    [activeRowIndex, locked, submitGuess, word.wordLength],
  );

  useGameKeyboard(handleInput, { enabled: !locked });

  const statusBar = (() => {
    if (guessMutation.isPending) {
      return (
        <GameStatusBar
          variant="submitting"
          currentGuess={activeRowIndex + 1}
          maxGuesses={word.maxGuesses}
          hintKey="pages.infinite.play.submitting"
        />
      );
    }
    if (mode === 'wordCompleted' && answer && won !== null) {
      return <GameStatusBar variant="completed" won={won} answer={answer} />;
    }
    return (
      <GameStatusBar
        variant="playing"
        currentGuess={activeRowIndex + 1}
        maxGuesses={word.maxGuesses}
        wordLength={word.wordLength}
        hintKey="pages.infinite.play.hint"
      />
    );
  })();

  return (
    <div className="flex flex-col items-center gap-6">
      {statusBar}
      <GameBoard rows={rows} activeRowIndex={activeRowIndex} shakingRowIndex={shakingRowIndex} />
      <PolishKeyboard onInput={handleInput} keyStates={keyStates} disabled={locked} />
      {mode === 'wordCompleted' && (
        <Button type="button" onClick={onNextWord}>
          {t('pages.infinite.play.nextWord')}
        </Button>
      )}
    </div>
  );
}
