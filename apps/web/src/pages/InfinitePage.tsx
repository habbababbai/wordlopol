import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { GamePageHeader } from '@/components/game/GamePageHeader';
import { InfiniteGamePlay } from '@/components/game/InfiniteGamePlay';
import { ErrorCard, GameBoardSkeleton, Spinner } from '@/components/ui/loader';
import { useInfiniteNextQuery } from '@/hooks/queries/use-infinite-next-query';
import { formatCalendarDate } from '@/lib/format-calendar-date';

function InfinitePageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 py-8 sm:gap-8 sm:py-12">
      {children}
    </div>
  );
}

export function InfinitePage() {
  const { t } = useTranslation();
  const { data: word, isPending, isError, refetch } = useInfiniteNextQuery();

  if (isPending) {
    return (
      <InfinitePageShell>
        <GamePageHeader title={t('pages.infinite.title')} />
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{t('pages.infinite.loading')}</p>
        <GameBoardSkeleton />
      </InfinitePageShell>
    );
  }

  if (isError || !word) {
    return (
      <InfinitePageShell>
        <GamePageHeader title={t('pages.infinite.title')} />
        <ErrorCard
          title={t('pages.infinite.errorTitle')}
          message={t('pages.infinite.errorMessage')}
          onRetry={() => void refetch()}
          retryLabel={t('pages.infinite.retry')}
        />
      </InfinitePageShell>
    );
  }

  const localizedDate = formatCalendarDate(word.date);

  return (
    <InfinitePageShell>
      <GamePageHeader
        title={t('pages.infinite.title')}
        subtitle={localizedDate}
        badge={{
          label: t('pages.infinite.progressLabel', {
            wordNumber: word.wordNumber,
            poolSize: word.poolSize,
          }),
        }}
      />
      <InfiniteGamePlay
        key={`${word.date}-${word.wordNumber}`}
        word={word}
        onNextWord={() => void refetch()}
      />
    </InfinitePageShell>
  );
}
