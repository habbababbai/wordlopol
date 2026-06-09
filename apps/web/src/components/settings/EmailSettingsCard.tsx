import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormField } from '@/components/auth/FormField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useChangeEmailMutation } from '@/hooks/mutations/use-change-email-mutation';
import { getApiErrorMessage } from '@/lib/api-error-message';
import type { ChangeEmailFormValues } from '@/lib/auth-form-types';
import { changeEmailSchema } from '@/lib/auth-schemas';
import { getFormFieldError, translateFieldError } from '@/lib/field-error';

type EmailSettingsCardProps = {
  currentEmail: string;
};

export function EmailSettingsCard({ currentEmail }: EmailSettingsCardProps) {
  const { t } = useTranslation();
  const changeEmailMutation = useChangeEmailMutation();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState, reset } = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    setSuccess(false);

    try {
      await changeEmailMutation.mutateAsync(values);
      reset({ newEmail: '' });
      setSuccess(true);
    } catch (err) {
      setApiError(getApiErrorMessage(err, t('common.errors.generic')));
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pages.settings.email.title')}</CardTitle>
        <CardDescription>{t('pages.settings.email.description')}</CardDescription>
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
              {t('pages.settings.email.success')}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              {t('pages.settings.email.currentLabel')}
            </span>
            <p className="text-sm text-muted-foreground">{currentEmail}</p>
          </div>
          <FormField
            id="settings-new-email"
            label={t('pages.settings.email.newLabel')}
            type="email"
            autoComplete="email"
            error={translateFieldError(getFormFieldError(formState.errors, 'newEmail'), t)}
            {...register('newEmail')}
          />
          <Button type="submit" disabled={formState.isSubmitting || changeEmailMutation.isPending}>
            {t('pages.settings.actions.changeEmail')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
