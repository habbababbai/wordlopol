import { useTranslation } from 'react-i18next';

import { StubPage } from './StubPage';

export function ProfilePage() {
  const { t } = useTranslation();

  return <StubPage title={t('pages.profile.title')} description={t('pages.profile.description')} />;
}
