import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SETTINGS_REDIRECT_DELAY_MS } from '@/components/settings/settings-constants';
import { useLogoutAllMutation } from '@/hooks/mutations/use-logout-all-mutation';
import { getApiErrorMessage } from '@/lib/api-error-message';

export function LogoutAllSettingsCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logoutAllMutation = useLogoutAllMutation();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      void navigate('/');
    }, SETTINGS_REDIRECT_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [success, navigate]);

  const handleLogoutAll = async () => {
    setApiError(null);
    setSuccess(false);

    try {
      await logoutAllMutation.mutateAsync();
      setSuccess(true);
    } catch (err) {
      setApiError(getApiErrorMessage(err, t('common.errors.generic')));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pages.settings.sessions.title')}</CardTitle>
        <CardDescription>{t('pages.settings.sessions.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {apiError && (
          <p role="alert" className="text-sm text-destructive">
            {apiError}
          </p>
        )}
        {success && (
          <p role="status" className="text-sm text-muted-foreground">
            {t('pages.settings.sessions.success')}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={logoutAllMutation.isPending || success}
          onClick={() => void handleLogoutAll()}
        >
          {t('pages.settings.actions.logoutAll')}
        </Button>
      </CardContent>
    </Card>
  );
}
