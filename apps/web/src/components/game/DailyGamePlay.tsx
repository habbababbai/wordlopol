import type { DailyChallengeDto } from '@wordlopol/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ApiError } from '@/api/errors';
import { authKeys } from '@/api/query-keys';
import { useDailyGuessMutation } from '@/hooks/mutations/use-daily-guess-mutation';
import { useAuth } from '@/hooks/useAuth';
import { useGameKeyboard } from '@/hooks/useGameKeyboard';
import { useToast } from '@/hooks/useToast';
import { buildKeyStates, createEmptyRows } from '@/lib/game-board';
import { getApiErrorMessage } from '@/lib/api-error-message';
import {
  loadDailyFinished,
  saveDailyAlreadyPlayed,
  saveDailyFinished,
} from '@/stores/daily-finished-store';

import { GameBoard, type GameBoardRow } from './GameBoard';
import { GameStatusBar } from './GameStatusBar';
import { PolishKeyboard } from './PolishKeyboard';

type PlayMode = 'playing' | 'completed' | 'alreadyPlayed';

type DailyGamePlayProps = {
  challenge: DailyChallengeDto;
};

function getInitialMode(date: string): PlayMode {
  const cached = loadDailyFinished(date);
  if (cached?.status === 'alreadyPlayed') return 'alreadyPlayed';
  if (cached?.status === 'completed') return 'completed';
  return 'playing';
}

function getInitialRows(date: string): GameBoardRow[] {
  const cached = loadDailyFinished(date);
  if (cached?.status === 'completed') return cached.rows;
  return createEmptyRows();
}

function getInitialActiveRowIndex(date: string, maxGuesses: number): number {
  const cached = loadDailyFinished(date);
  if (cached?.status === 'completed') return maxGuesses;
  return 0;
}

function getInitialAnswer(date: string): string | null {
  const cached = loadDailyFinished(date);
  if (cached?.status === 'completed') return cached.answer;
  return null;
}

function getInitialWon(date: string): boolean | null {
  const cached = loadDailyFinished(date);
  if (cached?.status === 'completed') return cached.won;
  return null;
}

export function DailyGamePlay({ challenge }: DailyGamePlayProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const guessMutation = useDailyGuessMutation();

  const [mode, setMode] = useState<PlayMode>(() => getInitialMode(challenge.date));
  const [rows, setRows] = useState<GameBoardRow[]>(() => getInitialRows(challenge.date));
  const [activeRowIndex, setActiveRowIndex] = useState(() =>
    getInitialActiveRowIndex(challenge.date, challenge.maxGuesses),
  );
  const [answer, setAnswer] = useState<string | null>(() => getInitialAnswer(challenge.date));
  const [won, setWon] = useState<boolean | null>(() => getInitialWon(challenge.date));
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

  const submitGuess = useCallback(async () => {
    if (mode !== 'playing' || guessMutation.isPending) return;

    const currentGuess = rows[activeRowIndex]?.letters ?? '';
    if (currentGuess.length < challenge.wordLength) {
      shakeActiveRow();
      return;
    }

    try {
      const result = await guessMutation.mutateAsync({
        guess: currentGuess,
      });

      const nextRows = [...rows];
      nextRows[activeRowIndex] = { letters: currentGuess, results: result.results };
      setRows(nextRows);

      if (result.won) {
        setActiveRowIndex(challenge.maxGuesses);
      } else if (!result.finished) {
        setActiveRowIndex((index) => index + 1);
      } else {
        setActiveRowIndex(challenge.maxGuesses);
      }

      if (result.finished && result.answer) {
        setAnswer(result.answer);
        setWon(result.won);
        setMode('completed');
        saveDailyFinished({
          date: challenge.date,
          status: 'completed',
          rows: nextRows,
          won: result.won,
          answer: result.answer,
        });
        if (isAuthenticated) {
          void queryClient.invalidateQueries({ queryKey: authKeys.profile() });
        }
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === 'ALREADY_PLAYED_TODAY') {
        setMode('alreadyPlayed');
        saveDailyAlreadyPlayed(challenge.date);
        return;
      }

      if (error instanceof ApiError && error.code === 'NOT_IN_DICTIONARY') {
        toast({ message: t('pages.daily.play.invalidWord'), variant: 'warning' });
        return;
      }

      toast({
        message: getApiErrorMessage(error, t('common.errors.generic')),
        variant: 'error',
      });
    }
  }, [
    activeRowIndex,
    challenge.date,
    challenge.maxGuesses,
    challenge.wordLength,
    guessMutation,
    isAuthenticated,
    mode,
    queryClient,
    rows,
    shakeActiveRow,
    t,
    toast,
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
        if (!current || current.results || current.letters.length >= challenge.wordLength) {
          return previous;
        }

        next[activeRowIndex] = {
          letters: current.letters + key.toLowerCase(),
        };
        return next;
      });
    },
    [activeRowIndex, challenge.wordLength, locked, submitGuess],
  );

  useGameKeyboard(handleInput, { enabled: !locked });

  const statusBar = (() => {
    if (guessMutation.isPending) {
      return (
        <GameStatusBar
          variant="submitting"
          currentGuess={activeRowIndex + 1}
          maxGuesses={challenge.maxGuesses}
          hintKey="pages.daily.play.submitting"
        />
      );
    }
    if (mode === 'alreadyPlayed') {
      return (
        <GameStatusBar variant="alreadyPlayed" message={t('pages.daily.play.alreadyPlayed')} />
      );
    }
    if (mode === 'completed' && answer && won !== null) {
      return <GameStatusBar variant="completed" won={won} answer={answer} />;
    }
    return (
      <GameStatusBar
        variant="playing"
        currentGuess={activeRowIndex + 1}
        maxGuesses={challenge.maxGuesses}
        wordLength={challenge.wordLength}
        hintKey="pages.daily.play.hint"
      />
    );
  })();

  return (
    <div className="flex flex-col items-center gap-6">
      {statusBar}
      {mode !== 'alreadyPlayed' && (
        <GameBoard rows={rows} activeRowIndex={activeRowIndex} shakingRowIndex={shakingRowIndex} />
      )}
      <PolishKeyboard onInput={handleInput} keyStates={keyStates} disabled={locked} />
      {mode === 'alreadyPlayed' && isAuthenticated && (
        <Link to="/profile" className="text-sm font-medium text-primary hover:underline">
          {t('pages.daily.play.viewProfile')}
        </Link>
      )}
    </div>
  );
}
