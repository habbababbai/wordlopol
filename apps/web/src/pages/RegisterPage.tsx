import { useTranslation } from 'react-i18next';

import { StubPage } from './StubPage';

export function RegisterPage() {
  const { t } = useTranslation();

  return (
    <StubPage title={t('pages.register.title')} description={t('pages.register.description')} />
  );
}
