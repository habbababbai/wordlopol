import { useTranslation } from 'react-i18next';

import { StubPage } from './StubPage';

export function InfinitePage() {
  const { t } = useTranslation();

  return (
    <StubPage title={t('pages.infinite.title')} description={t('pages.infinite.description')} />
  );
}
