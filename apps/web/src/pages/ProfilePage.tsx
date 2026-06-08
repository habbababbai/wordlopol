import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorCard, Spinner } from '@/components/ui/loader';
import { useProfileQuery } from '@/hooks/queries/use-profile-query';

function formatWinRate(played: number, won: number): string {
  if (played === 0) {
    return '—';
  }

  return `${Math.round((won / played) * 100)}%`;
}

type StatItemProps = {
  label: string;
  value: string | number;
};

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  const { data: profile, isPending, isError, refetch } = useProfileQuery();

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-16">
        <h1 className="text-2xl font-bold text-foreground">{t('pages.profile.title')}</h1>
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{t('pages.profile.loading')}</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-16">
        <h1 className="text-2xl font-bold text-foreground">{t('pages.profile.title')}</h1>
        <ErrorCard
          title={t('pages.profile.errorTitle')}
          message={t('pages.profile.errorMessage')}
          onRetry={() => void refetch()}
          retryLabel={t('pages.profile.retry')}
        />
      </div>
    );
  }

  const { displayName, email, emailVerified, stats } = profile;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">{t('pages.profile.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-lg font-medium text-foreground">{displayName}</p>
          <Badge variant={emailVerified ? 'success' : 'warning'}>
            {emailVerified ? t('pages.profile.emailVerified') : t('pages.profile.emailNotVerified')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{email}</p>
        {!emailVerified && (
          <p className="text-sm">
            <Link to="/verify-email" className="font-medium text-primary hover:underline">
              {t('auth.guards.verifyEmailLink')}
            </Link>
          </p>
        )}
      </header>

      <section aria-labelledby="profile-stats-heading">
        <h2 id="profile-stats-heading" className="sr-only">
          {t('pages.profile.stats.title')}
        </h2>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.profile.stats.daily.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <StatItem label={t('pages.profile.stats.played')} value={stats.dailyPlayed} />
                <StatItem label={t('pages.profile.stats.won')} value={stats.dailyWon} />
                <StatItem
                  label={t('pages.profile.stats.winRate')}
                  value={formatWinRate(stats.dailyPlayed, stats.dailyWon)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('pages.profile.stats.infinite.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <StatItem label={t('pages.profile.stats.played')} value={stats.infinitePlayed} />
                <StatItem label={t('pages.profile.stats.won')} value={stats.infiniteWon} />
                <StatItem
                  label={t('pages.profile.stats.winRate')}
                  value={formatWinRate(stats.infinitePlayed, stats.infiniteWon)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
