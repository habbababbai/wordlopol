import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormField } from '@/components/auth/FormField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useChangeDisplayNameMutation } from '@/hooks/mutations/use-change-display-name-mutation';
import { getApiErrorMessage } from '@/lib/api-error-message';
import type { ChangeDisplayNameFormValues } from '@/lib/auth-form-types';
import { changeDisplayNameSchema } from '@/lib/auth-schemas';
import { getFormFieldError, translateFieldError } from '@/lib/field-error';

type DisplayNameSettingsCardProps = {
  displayName: string;
};

export function DisplayNameSettingsCard({ displayName }: DisplayNameSettingsCardProps) {
  const { t } = useTranslation();
  const changeDisplayNameMutation = useChangeDisplayNameMutation();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState, reset } = useForm<ChangeDisplayNameFormValues>({
    resolver: zodResolver(changeDisplayNameSchema),
    defaultValues: { displayName },
  });

  useEffect(() => {
    reset({ displayName });
  }, [displayName, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    setSuccess(false);

    try {
      await changeDisplayNameMutation.mutateAsync(values);
      setSuccess(true);
    } catch (err) {
      setApiError(getApiErrorMessage(err, t('common.errors.generic')));
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pages.settings.displayName.title')}</CardTitle>
        <CardDescription>{t('pages.settings.displayName.description')}</CardDescription>
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
              {t('pages.settings.displayName.success')}
            </p>
          )}
          <FormField
            id="settings-display-name"
            label={t('auth.fields.displayName')}
            autoComplete="nickname"
            error={translateFieldError(getFormFieldError(formState.errors, 'displayName'), t)}
            {...register('displayName')}
          />
          <Button
            type="submit"
            disabled={formState.isSubmitting || changeDisplayNameMutation.isPending}
          >
            {t('pages.settings.actions.saveDisplayName')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
