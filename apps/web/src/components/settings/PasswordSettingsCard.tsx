import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { FormField } from '@/components/auth/FormField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SETTINGS_REDIRECT_DELAY_MS } from '@/components/settings/settings-constants';
import { useChangePasswordMutation } from '@/hooks/mutations/use-change-password-mutation';
import { getApiErrorMessage } from '@/lib/api-error-message';
import type { ChangePasswordFormValues } from '@/lib/auth-form-types';
import { changePasswordSchema } from '@/lib/auth-schemas';
import { getFormFieldError, translateFieldError } from '@/lib/field-error';

export function PasswordSettingsCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const changePasswordMutation = useChangePasswordMutation();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState, reset } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => {
      void navigate('/login');
    }, SETTINGS_REDIRECT_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success, navigate]);

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    setSuccess(false);

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      setSuccess(true);
    } catch (err) {
      setApiError(getApiErrorMessage(err, t('common.errors.generic')));
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pages.settings.password.title')}</CardTitle>
        <CardDescription>{t('pages.settings.password.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)}>
          {apiError && (
            <p role="alert" className="text-sm text-destructive">
              {apiError}
            </p>
          )}
          {success && (
            <p role="status" className="text-sm text-muted-foreground">
              {t('pages.settings.password.success')}
            </p>
          )}
          <FormField
            id="settings-current-password"
            label={t('pages.settings.password.currentLabel')}
            type="password"
            autoComplete="current-password"
            error={translateFieldError(getFormFieldError(formState.errors, 'currentPassword'), t)}
            {...register('currentPassword')}
          />
          <FormField
            id="settings-new-password"
            label={t('auth.fields.newPassword')}
            type="password"
            autoComplete="new-password"
            error={translateFieldError(getFormFieldError(formState.errors, 'newPassword'), t)}
            {...register('newPassword')}
          />
          <FormField
            id="settings-confirm-new-password"
            label={t('auth.fields.confirmPassword')}
            type="password"
            autoComplete="new-password"
            error={translateFieldError(
              getFormFieldError(formState.errors, 'confirmNewPassword'),
              t,
            )}
            {...register('confirmNewPassword')}
          />
          <Button
            type="submit"
            disabled={formState.isSubmitting || changePasswordMutation.isPending || success}
          >
            {t('pages.settings.actions.changePassword')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
