import { useTranslation } from 'react-i18next';

import { StubPage } from './StubPage';

export function ResetPasswordPage() {
  const { t } = useTranslation();

  return (
    <StubPage
      title={t('pages.resetPassword.title')}
      description={t('pages.resetPassword.description')}
    />
  );
}
