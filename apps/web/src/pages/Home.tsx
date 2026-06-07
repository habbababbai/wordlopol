import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { api } from '../api/client';
import { AmbientBackground } from '../components/AmbientBackground';
import { Button } from '../components/ui/button';

export function Home() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.getHealth(),
  });

  let statusMessage = '';
  if (error) {
    statusMessage = t('home.apiUnavailable');
  } else if (isLoading) {
    statusMessage = t('home.apiConnecting');
  } else if (data) {
    statusMessage = t('home.apiStatus', { status: data.status });
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <AmbientBackground />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <div className="flex flex-col gap-2">
          <h1
            className="text-5xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-family-display)', fontStyle: 'italic' }}
          >
            {t('common.appName')}
          </h1>
          <p className="text-base text-muted-foreground">{t('home.tagline')}</p>
        </div>

        <Button asChild size="lg">
          <Link to="/daily">{t('home.playToday')}</Link>
        </Button>

        {statusMessage && (
          <p
            className="text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {statusMessage}
          </p>
        )}
      </div>
    </div>
  );
}
