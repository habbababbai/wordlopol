import { useTranslation } from 'react-i18next';

import { GameTile } from '../GameTile';

const CORRECT_EXAMPLE = ['G', 'O', 'R', 'Ą', 'C'] as const;
const PRESENT_EXAMPLE = ['P', 'Ę', 'T', 'L', 'A'] as const;

export function HomeHowToPlay() {
  const { t } = useTranslation();
  const rules = t('home.howToPlay.rules', { returnObjects: true }) as string[];

  return (
    <section className="flex flex-col gap-6 border-t border-border pt-12">
      <h2 className="text-center text-xl font-semibold text-foreground">
        {t('home.howToPlay.title')}
      </h2>

      <div className="mx-auto grid w-full max-w-2xl gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {CORRECT_EXAMPLE.map((letter, index) => (
                <GameTile
                  key={letter}
                  letter={letter}
                  state={index === 0 ? 'correct' : 'absent'}
                  size="sm"
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-[var(--tile-correct)]">G</span>{' '}
              {t('home.howToPlay.correctHint')}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {PRESENT_EXAMPLE.map((letter, index) => (
                <GameTile
                  key={letter}
                  letter={letter}
                  state={index === 2 ? 'present' : 'absent'}
                  size="sm"
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-[var(--tile-present)]">T</span>{' '}
              {t('home.howToPlay.presentHint')}
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
          {rules.map((tip, index) => (
            <li key={tip} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {index + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
