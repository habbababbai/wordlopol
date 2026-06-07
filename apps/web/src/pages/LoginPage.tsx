import { useTranslation } from 'react-i18next';

import { StubPage } from './StubPage';

export function LoginPage() {
  const { t } = useTranslation();

  return <StubPage title={t('pages.login.title')} description={t('pages.login.description')} />;
}
