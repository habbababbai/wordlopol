import { useTranslation } from 'react-i18next';

import { StubPage } from './StubPage';

export function VerifyEmailPage() {
  const { t } = useTranslation();

  return (
    <StubPage
      title={t('pages.verifyEmail.title')}
      description={t('pages.verifyEmail.description')}
    />
  );
}
