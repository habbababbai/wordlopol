import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { FormField } from '@/components/auth/FormField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SETTINGS_REDIRECT_DELAY_MS } from '@/components/settings/settings-constants';
import { useDeleteAccountMutation } from '@/hooks/mutations/use-delete-account-mutation';
import { getApiErrorMessage } from '@/lib/api-error-message';
import type { DeleteAccountFormValues } from '@/lib/auth-form-types';
import { deleteAccountSchema } from '@/lib/auth-schemas';
import { getFormFieldError, translateFieldError } from '@/lib/field-error';

export function DeleteAccountSettingsCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const deleteAccountMutation = useDeleteAccountMutation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState, reset, control } = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: '',
      confirmDeletion: false,
    },
  });

  const confirmDeletion = useWatch({ control, name: 'confirmDeletion' });
  const password = useWatch({ control, name: 'password' });

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => {
      void navigate('/');
    }, SETTINGS_REDIRECT_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success, navigate]);

  const handleCancel = () => {
    setShowConfirm(false);
    setApiError(null);
    reset({ password: '', confirmDeletion: false });
  };

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);

    try {
      await deleteAccountMutation.mutateAsync({ password: values.password });
      setSuccess(true);
    } catch (err) {
      setApiError(getApiErrorMessage(err, t('common.errors.generic')));
    }
  });

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">
          {t('pages.settings.deleteAccount.title')}
        </CardTitle>
        <CardDescription>{t('pages.settings.deleteAccount.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {success ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t('pages.settings.deleteAccount.success')}
          </p>
        ) : !showConfirm ? (
          <Button type="button" variant="destructive" onClick={() => setShowConfirm(true)}>
            {t('pages.settings.deleteAccount.start')}
          </Button>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)}>
            <p className="text-sm font-medium text-destructive">
              {t('pages.settings.deleteAccount.warning')}
            </p>

            {apiError && (
              <p role="alert" className="text-sm text-destructive">
                {apiError}
              </p>
            )}

            <label className="flex items-start gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="mt-0.5 size-4 rounded border-border"
                {...register('confirmDeletion')}
              />
              <span>{t('pages.settings.deleteAccount.confirmCheckbox')}</span>
            </label>
            {formState.errors.confirmDeletion && (
              <p role="alert" className="text-sm text-destructive">
                {translateFieldError(getFormFieldError(formState.errors, 'confirmDeletion'), t)}
              </p>
            )}

            <FormField
              id="settings-delete-password"
              label={t('pages.settings.deleteAccount.passwordLabel')}
              type="password"
              autoComplete="current-password"
              error={translateFieldError(getFormFieldError(formState.errors, 'password'), t)}
              {...register('password')}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                variant="destructive"
                disabled={
                  !confirmDeletion ||
                  !password ||
                  formState.isSubmitting ||
                  deleteAccountMutation.isPending
                }
              >
                {t('pages.settings.deleteAccount.submit')}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                {t('pages.settings.deleteAccount.cancel')}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
