import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { GamePageHeader } from '@/components/game/GamePageHeader';
import { InfiniteGameIcon } from '@/components/game/game-page-icons';
import { InfiniteGamePlay } from '@/components/game/InfiniteGamePlay';
import { ErrorCard, GameBoardSkeleton, Spinner } from '@/components/ui/loader';
import { useInfiniteNextQuery } from '@/hooks/queries/use-infinite-next-query';
import { usePageMetadata } from '@/hooks/usePageMetadata';
import { formatCalendarDate } from '@/lib/format-calendar-date';

function InfinitePageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 py-8 sm:gap-8 sm:py-12">
      {children}
    </div>
  );
}

function InfinitePageHeader() {
  const { t } = useTranslation();

  return (
    <GamePageHeader
      icon={<InfiniteGameIcon />}
      title={t('pages.infinite.title')}
      description={t('pages.infinite.description')}
    />
  );
}

export function InfinitePage() {
  const { t } = useTranslation();
  const { data: word, isPending, isError, refetch } = useInfiniteNextQuery();
  const pageTitle = t('pages.infinite.title');
  const pageDescription = t('pages.infinite.description');

  usePageMetadata({ title: pageTitle, description: pageDescription });

  if (isPending) {
    return (
      <InfinitePageShell>
        <InfinitePageHeader />
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{t('pages.infinite.loading')}</p>
        <GameBoardSkeleton />
      </InfinitePageShell>
    );
  }

  if (isError || !word) {
    return (
      <InfinitePageShell>
        <InfinitePageHeader />
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
        icon={<InfiniteGameIcon />}
        title={pageTitle}
        description={pageDescription}
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
