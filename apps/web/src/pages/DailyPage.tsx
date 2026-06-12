import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { DailyGamePlay } from '@/components/game/DailyGamePlay';
import { GamePageHeader } from '@/components/game/GamePageHeader';
import { ErrorCard, GameBoardSkeleton, Spinner } from '@/components/ui/loader';
import { useDailyTodayQuery } from '@/hooks/queries/use-daily-today-query';
import { formatCalendarDate } from '@/lib/format-calendar-date';

function DailyPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 py-8 sm:gap-8 sm:py-12">
      {children}
    </div>
  );
}

export function DailyPage() {
  const { t } = useTranslation();
  const { data: challenge, isPending, isError, refetch } = useDailyTodayQuery();

  if (isPending) {
    return (
      <DailyPageShell>
        <GamePageHeader title={t('pages.daily.title')} />
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{t('pages.daily.loading')}</p>
        <GameBoardSkeleton />
      </DailyPageShell>
    );
  }

  if (isError || !challenge) {
    return (
      <DailyPageShell>
        <GamePageHeader title={t('pages.daily.title')} />
        <ErrorCard
          title={t('pages.daily.errorTitle')}
          message={t('pages.daily.errorMessage')}
          onRetry={() => void refetch()}
          retryLabel={t('pages.daily.retry')}
        />
      </DailyPageShell>
    );
  }

  const localizedDate = formatCalendarDate(challenge.date);

  return (
    <DailyPageShell>
      <GamePageHeader
        title={t('pages.daily.title')}
        subtitle={t('pages.daily.dateLabel', { date: localizedDate })}
      />
      <DailyGamePlay key={challenge.date} challenge={challenge} />
    </DailyPageShell>
  );
}
