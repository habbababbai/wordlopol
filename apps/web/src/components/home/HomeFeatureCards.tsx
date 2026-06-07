import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

type HomeFeatureCardsProps = {
  isLoggedIn?: boolean;
};

type FeatureCardConfig = {
  icon: ReactNode;
  titleKey: 'daily' | 'infinite' | 'stats';
  locked?: boolean;
  ctaKey: 'cta' | 'ctaGuest' | 'ctaAuth';
};

function FeatureIcon({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
      {children}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function InfinityIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path d="M5 12c0-3 2.5-5 5-5s5 2 5 5-2.5 5-5 5-5-2-5-5z" />
      <path d="M19 12c0-3-2.5-5-5-5s-5 2-5 5 2.5 5 5 5 5-2 5-5z" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M5 5H3v1a4 4 0 0 0 4 4M19 5h2v1a4 4 0 0 1-4 4" />
    </svg>
  );
}

export function HomeFeatureCards({ isLoggedIn = false }: HomeFeatureCardsProps) {
  const { t } = useTranslation();

  const cards: FeatureCardConfig[] = [
    { icon: <CalendarIcon />, titleKey: 'daily', ctaKey: 'cta' },
    {
      icon: <InfinityIcon />,
      titleKey: 'infinite',
      locked: !isLoggedIn,
      ctaKey: isLoggedIn ? 'ctaAuth' : 'ctaGuest',
    },
    {
      icon: <TrophyIcon />,
      titleKey: 'stats',
      ctaKey: isLoggedIn ? 'ctaAuth' : 'ctaGuest',
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {cards.map(({ icon, titleKey, locked, ctaKey }) => (
        <div
          key={titleKey}
          className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
        >
          <FeatureIcon>{icon}</FeatureIcon>

          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">
                {t(`home.features.${titleKey}.title`)}
              </h3>
              {locked && <Badge variant="muted">{t('home.lockedBadge')}</Badge>}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(`home.features.${titleKey}.description`)}
            </p>
          </div>

          <Button variant="ghost" className="h-auto justify-start p-0 text-sm font-semibold">
            {t(`home.features.${titleKey}.${ctaKey}`)}
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      ))}
    </section>
  );
}
