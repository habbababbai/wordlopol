import { useTranslation } from 'react-i18next';

import { StubPage } from './StubPage';

export function ForgotPasswordPage() {
  const { t } = useTranslation();

  return (
    <StubPage
      title={t('pages.forgotPassword.title')}
      description={t('pages.forgotPassword.description')}
    />
  );
}
