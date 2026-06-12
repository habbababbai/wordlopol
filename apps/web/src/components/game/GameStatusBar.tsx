import { useTranslation } from 'react-i18next';

type GameStatusBarPlayingProps = {
  variant: 'playing';
  currentGuess: number;
  maxGuesses: number;
  wordLength: number;
  hintKey?: 'pages.daily.play.hint' | 'pages.infinite.play.hint';
};

type GameStatusBarSubmittingProps = {
  variant: 'submitting';
  currentGuess: number;
  maxGuesses: number;
  hintKey?: 'pages.daily.play.submitting' | 'pages.infinite.play.submitting';
};

type GameStatusBarCompletedProps = {
  variant: 'completed';
  won: boolean;
  answer: string;
};

type GameStatusBarAlreadyPlayedProps = {
  variant: 'alreadyPlayed';
  message: string;
};

export type GameStatusBarProps =
  | GameStatusBarPlayingProps
  | GameStatusBarSubmittingProps
  | GameStatusBarCompletedProps
  | GameStatusBarAlreadyPlayedProps;

export function GameStatusBar(props: GameStatusBarProps) {
  const { t } = useTranslation();

  if (props.variant === 'alreadyPlayed' || props.variant === 'completed') {
    const message =
      props.variant === 'alreadyPlayed'
        ? props.message
        : props.won
          ? t('game.status.completedWon', { answer: props.answer })
          : t('game.status.completedLost', { answer: props.answer });

    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full max-w-sm rounded-lg border border-border bg-card px-4 py-3 text-center text-base text-foreground"
      >
        {message}
      </div>
    );
  }

  if (props.variant === 'submitting') {
    const hintKey = props.hintKey ?? 'pages.daily.play.submitting';

    return (
      <div
        role="status"
        aria-live="polite"
        className="flex w-full max-w-sm flex-col gap-2 text-center"
      >
        <p className="text-lg font-bold text-foreground">
          {t('game.status.guessProgress', {
            current: props.currentGuess,
            max: props.maxGuesses,
          })}
        </p>
        <p className="text-base font-medium text-primary">{t(hintKey)}</p>
      </div>
    );
  }

  const hintKey = props.hintKey ?? 'pages.daily.play.hint';

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-full max-w-sm flex-col gap-2 text-center"
    >
      <p className="text-lg font-bold text-foreground">
        {t('game.status.guessProgress', {
          current: props.currentGuess,
          max: props.maxGuesses,
        })}
      </p>
      <p className="text-base text-muted-foreground">
        {t(hintKey, {
          wordLength: props.wordLength,
          maxGuesses: props.maxGuesses,
        })}
      </p>
    </div>
  );
}
