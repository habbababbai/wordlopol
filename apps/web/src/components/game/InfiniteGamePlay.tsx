import type { GuessResultDto, InfiniteWordDto } from '@wordlopol/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ApiError } from '@/api/errors';
import { authKeys } from '@/api/query-keys';
import { useInfiniteGuessMutation } from '@/hooks/mutations/use-infinite-guess-mutation';
import { useGameKeyboard } from '@/hooks/useGameKeyboard';
import { useGameSounds } from '@/hooks/useGameSounds';
import { useToast } from '@/hooks/useToast';
import { getRowRevealDurationMs } from '@/lib/game-animation';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { buildKeyStates, createEmptyRows } from '@/lib/game-board';

import { GameBoard, type GameBoardRow } from './GameBoard';
import { GameResultModal } from './GameResultModal';
import { GameStatusBar } from './GameStatusBar';
import { PolishKeyboard } from './PolishKeyboard';

type PlayMode = 'playing' | 'wordCompleted';

type InfiniteGamePlayProps = {
  word: InfiniteWordDto;
  onNextWord: () => void;
};

export function InfiniteGamePlay({ word, onNextWord }: InfiniteGamePlayProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const guessMutation = useInfiniteGuessMutation();
  const { playType, playRevealSequence } = useGameSounds();

  const [mode, setMode] = useState<PlayMode>('playing');
  const [rows, setRows] = useState<GameBoardRow[]>(() => createEmptyRows());
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [finalGuessNumber, setFinalGuessNumber] = useState<number | null>(null);
  const [awaitingResultModal, setAwaitingResultModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [shakingRowIndex, setShakingRowIndex] = useState<number | null>(null);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (modalTimeoutRef.current !== null) {
        clearTimeout(modalTimeoutRef.current);
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
      playRevealSequence(result.results);

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
          setFinalGuessNumber(result.guessNumber);
          setMode('wordCompleted');
          setAwaitingResultModal(true);
          void queryClient.invalidateQueries({ queryKey: authKeys.profile() });

          if (modalTimeoutRef.current !== null) {
            clearTimeout(modalTimeoutRef.current);
          }
          modalTimeoutRef.current = setTimeout(() => {
            modalTimeoutRef.current = null;
            setAwaitingResultModal(false);
            setShowResultModal(true);
          }, getRowRevealDurationMs(word.wordLength));
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
    playRevealSequence,
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
        playType();
        return next;
      });
    },
    [activeRowIndex, locked, playType, submitGuess, word.wordLength],
  );

  useGameKeyboard(handleInput, { enabled: !locked });

  const statusBar = (() => {
    if (awaitingResultModal || showResultModal) {
      return null;
    }
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
      {showResultModal && answer && won !== null && finalGuessNumber !== null && (
        <GameResultModal
          open
          mode="infinite"
          won={won}
          guessNumber={finalGuessNumber}
          answer={answer}
          onGoHome={() => {
            void navigate('/');
          }}
          onNextWord={() => {
            setShowResultModal(false);
            onNextWord();
          }}
        />
      )}
    </div>
  );
}
