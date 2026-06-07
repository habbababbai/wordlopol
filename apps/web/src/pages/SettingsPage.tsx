import { useTranslation } from 'react-i18next';

import { StubPage } from './StubPage';

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <StubPage title={t('pages.settings.title')} description={t('pages.settings.description')} />
  );
}
