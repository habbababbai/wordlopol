import { useTranslation } from 'react-i18next';

import { DailyGamePlay } from '@/components/game/DailyGamePlay';
import { ErrorCard, GameBoardSkeleton, Spinner } from '@/components/ui/loader';
import { useDailyTodayQuery } from '@/hooks/queries/use-daily-today-query';

export function DailyPage() {
  const { t } = useTranslation();
  const { data: challenge, isPending, isError, refetch } = useDailyTodayQuery();

  if (isPending) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 py-8 sm:py-12">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">{t('pages.daily.title')}</h1>
        </header>
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{t('pages.daily.loading')}</p>
        <GameBoardSkeleton />
      </div>
    );
  }

  if (isError || !challenge) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 py-8 sm:py-12">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">{t('pages.daily.title')}</h1>
        </header>
        <ErrorCard
          title={t('pages.daily.errorTitle')}
          message={t('pages.daily.errorMessage')}
          onRetry={() => void refetch()}
          retryLabel={t('pages.daily.retry')}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-foreground">{t('pages.daily.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('pages.daily.dateLabel', { date: challenge.date })}
        </p>
      </header>
      <DailyGamePlay challenge={challenge} />
    </div>
  );
}
