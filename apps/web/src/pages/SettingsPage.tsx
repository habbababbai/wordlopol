import { useTranslation } from 'react-i18next';

import { DeleteAccountSettingsCard } from '@/components/settings/DeleteAccountSettingsCard';
import { DisplayNameSettingsCard } from '@/components/settings/DisplayNameSettingsCard';
import { EmailSettingsCard } from '@/components/settings/EmailSettingsCard';
import { LogoutAllSettingsCard } from '@/components/settings/LogoutAllSettingsCard';
import { PasswordSettingsCard } from '@/components/settings/PasswordSettingsCard';
import { ErrorCard, Spinner } from '@/components/ui/loader';
import { useProfileQuery } from '@/hooks/queries/use-profile-query';

export function SettingsPage() {
  const { t } = useTranslation();
  const { data: profile, isPending, isError, refetch } = useProfileQuery();

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-16">
        <h1 className="text-2xl font-bold text-foreground">{t('pages.settings.title')}</h1>
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{t('pages.settings.loading')}</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-16">
        <h1 className="text-2xl font-bold text-foreground">{t('pages.settings.title')}</h1>
        <ErrorCard
          title={t('pages.settings.errorTitle')}
          message={t('pages.settings.errorMessage')}
          onRetry={() => void refetch()}
          retryLabel={t('pages.settings.retry')}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">{t('pages.settings.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('pages.settings.description')}</p>
      </header>

      <div className="flex flex-col gap-6">
        <DisplayNameSettingsCard displayName={profile.displayName} />
        <EmailSettingsCard currentEmail={profile.email} />
        <PasswordSettingsCard />
        <LogoutAllSettingsCard />
        <DeleteAccountSettingsCard />
      </div>
    </div>
  );
}
