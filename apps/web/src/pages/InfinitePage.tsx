import { useTranslation } from 'react-i18next';

import { InfiniteGamePlay } from '@/components/game/InfiniteGamePlay';
import { ErrorCard, GameBoardSkeleton, Spinner } from '@/components/ui/loader';
import { useInfiniteNextQuery } from '@/hooks/queries/use-infinite-next-query';
import { formatCalendarDate } from '@/lib/format-calendar-date';

export function InfinitePage() {
  const { t } = useTranslation();
  const { data: word, isPending, isError, refetch } = useInfiniteNextQuery();

  if (isPending) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 py-8 sm:py-12">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">{t('pages.infinite.title')}</h1>
        </header>
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{t('pages.infinite.loading')}</p>
        <GameBoardSkeleton />
      </div>
    );
  }

  if (isError || !word) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 py-8 sm:py-12">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">{t('pages.infinite.title')}</h1>
        </header>
        <ErrorCard
          title={t('pages.infinite.errorTitle')}
          message={t('pages.infinite.errorMessage')}
          onRetry={() => void refetch()}
          retryLabel={t('pages.infinite.retry')}
        />
      </div>
    );
  }

  const localizedDate = formatCalendarDate(word.date);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-foreground">{t('pages.infinite.title')}</h1>
        <p className="text-sm text-muted-foreground">{localizedDate}</p>
        <p className="text-sm text-muted-foreground">
          {t('pages.infinite.progressLabel', {
            wordNumber: word.wordNumber,
            poolSize: word.poolSize,
          })}
        </p>
      </header>
      <InfiniteGamePlay
        key={`${word.date}-${word.wordNumber}`}
        word={word}
        onNextWord={() => void refetch()}
      />
    </div>
  );
}
