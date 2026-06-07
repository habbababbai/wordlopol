import { useTranslation } from 'react-i18next';

import { StubPage } from './StubPage';

export function DailyPage() {
  const { t } = useTranslation();

  return <StubPage title={t('pages.daily.title')} description={t('pages.daily.description')} />;
}
