import { useTranslation } from 'react-i18next';

import { GameTile } from '@/components/GameTile';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type GameResultModalMode = 'daily' | 'infinite';

type GameResultModalProps = {
  open: boolean;
  mode: GameResultModalMode;
  won: boolean;
  guessNumber: number;
  answer: string;
  onGoHome: () => void;
  onNextWord?: () => void;
};

function preventDismiss(event: Event): void {
  event.preventDefault();
}

export function GameResultModal({
  open,
  mode,
  won,
  guessNumber,
  answer,
  onGoHome,
  onNextWord,
}: GameResultModalProps) {
  const { t } = useTranslation();
  const letters = answer.toUpperCase().split('');

  const title = won ? t('game.result.wonTitle', { guessNumber }) : t('game.result.lostTitle');

  const description = won
    ? undefined
    : t('game.result.answerLabel', { answer: answer.toUpperCase() });

  return (
    <Dialog open={open}>
      <DialogContent
        onPointerDownOutside={preventDismiss}
        onEscapeKeyDown={preventDismiss}
        aria-describedby={won ? undefined : 'game-result-answer'}
      >
        <DialogHeader>
          <DialogTitle
            className={won ? 'text-[var(--tile-correct)]' : undefined}
            style={
              won ? { fontFamily: 'var(--font-family-display)', fontStyle: 'italic' } : undefined
            }
          >
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription id="game-result-answer">{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="mt-6 flex justify-center gap-1 sm:mt-8 sm:gap-1.5">
          {letters.map((letter, index) => (
            <GameTile
              key={`${letter}-${index}`}
              letter={letter}
              state="correct"
              size="sm"
              waveBounce={won}
              waveDelay={index * 0.08}
            />
          ))}
        </div>

        <DialogFooter>
          {mode === 'infinite' && onNextWord ? (
            <>
              <Button type="button" variant="outline" onClick={onGoHome}>
                {t('game.result.goHome')}
              </Button>
              <Button type="button" autoFocus onClick={onNextWord}>
                {t('pages.infinite.play.nextWord')}
              </Button>
            </>
          ) : (
            <Button type="button" autoFocus onClick={onGoHome}>
              {t('game.result.goHome')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
