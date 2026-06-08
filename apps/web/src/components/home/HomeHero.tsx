import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { loginPathWithReturnTo } from '../../lib/return-to';
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

type HomeHeroProps = {
  isLoggedIn?: boolean;
};

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function InfinityIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12c0-3 2.5-5 5-5s5 2 5 5-2.5 5-5 5-5-2-5-5z" />
      <path d="M19 12c0-3-2.5-5-5-5s-5 2-5 5 2.5 5 5 5 5-2 5-5z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function HomeHero({ isLoggedIn = false }: HomeHeroProps) {
  const { t } = useTranslation();
  const infiniteHref = isLoggedIn ? '/infinite' : loginPathWithReturnTo('/infinite');

  return (
    <section className="flex w-full flex-col items-center gap-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-end justify-center gap-2">
          <h1
            className="text-5xl leading-none font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl"
            style={{ fontFamily: 'var(--font-family-display)', fontStyle: 'italic' }}
          >
            {t('common.appName')}
          </h1>
          <Badge className="mb-2">{t('home.localeBadge')}</Badge>
        </div>
        <p className="max-w-md px-2 text-base text-muted-foreground sm:px-0 sm:text-lg">
          {t('home.tagline')}
        </p>
      </div>

      <div className="flex w-full max-w-[17.5rem] justify-center gap-1.5 sm:max-w-none sm:gap-2">
        {DEMO_TILES.map((tile, index) => (
          <GameTile
            key={index}
            letter={tile.letter}
            state={tile.state}
            delay={index * 0.12}
            size="sm"
            className="h-11 w-11 text-base sm:h-14 sm:w-14 sm:text-xl lg:h-16 lg:w-16 lg:text-2xl"
          />
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-col gap-3 sm:flex-row">
        <Button
          asChild
          size="lg"
          className="w-full flex-1 px-6 py-3.5 sm:grid sm:grid-cols-[1rem_1fr_1rem] sm:items-center sm:justify-items-center"
        >
          <Link to="/daily">
            <span className="justify-self-start">
              <CalendarIcon />
            </span>
            <span className="flex-1 text-center sm:flex-none">{t('home.playToday')}</span>
            <span className="ml-auto justify-self-end sm:ml-0">
              <ArrowRightIcon />
            </span>
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full flex-1 px-6 py-3.5">
          <Link to={infiniteHref}>
            <InfinityIcon />
            {t('home.playInfinite')}
          </Link>
        </Button>
      </div>

      {!isLoggedIn && (
        <p className="max-w-sm px-2 text-sm text-muted-foreground">
          <Link to="/register" className="font-medium text-primary hover:underline">
            {t('home.registerCta')}
          </Link>{' '}
          {t('home.guestPrompt')}
        </p>
      )}
    </section>
  );
}
