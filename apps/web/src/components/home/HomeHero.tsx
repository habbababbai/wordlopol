import { useTranslation } from 'react-i18next';

import { GameTile, type TileState } from '../GameTile';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const DEMO_TILES: { letter: string; state: TileState }[] = [
  { letter: 'S', state: 'correct' },
  { letter: 'Ł', state: 'absent' },
  { letter: 'O', state: 'present' },
  { letter: 'W', state: 'correct' },
  { letter: 'O', state: 'absent' },
];

export function HomeHero() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col items-center gap-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <h1
            className="text-6xl leading-none font-bold tracking-tight text-foreground sm:text-7xl"
            style={{ fontFamily: 'var(--font-family-display)', fontStyle: 'italic' }}
          >
            {t('common.appName')}
          </h1>
          <Badge className="mb-2 self-end">{t('home.localeBadge')}</Badge>
        </div>
        <p className="max-w-md text-lg text-muted-foreground">{t('home.tagline')}</p>
      </div>

      <div className="flex gap-2">
        {DEMO_TILES.map((tile, index) => (
          <GameTile
            key={index}
            letter={tile.letter}
            state={tile.state}
            delay={index * 0.12}
            size="lg"
          />
        ))}
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row">
        <Button size="lg" className="flex-1">
          {t('home.playToday')}
        </Button>
        <Button variant="outline" size="lg" className="flex-1">
          {t('home.playInfinite')}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        <Button variant="link" className="h-auto p-0 text-sm font-medium">
          {t('home.registerCta')}
        </Button>{' '}
        {t('home.guestPrompt')}
      </p>
    </section>
  );
}
