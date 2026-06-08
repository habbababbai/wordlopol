import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { api } from '../api/client';
import { AuthFormCard } from '../components/auth/AuthFormCard';
import { AuthPageLayout } from '../components/auth/AuthPageLayout';
import { FormField } from '../components/auth/FormField';
import { Button } from '../components/ui/button';
import { getApiErrorMessage } from '../lib/api-error-message';
import type { EmailOnlyFormValues } from '../lib/auth-form-types';
import { emailOnlySchema } from '../lib/auth-schemas';
import { getFormFieldError, translateFieldError } from '../lib/field-error';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<EmailOnlyFormValues>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values: EmailOnlyFormValues) => {
    setApiError(null);

    try {
      await api.forgotPassword({ email: values.email });
      setSubmitted(true);
    } catch (err) {
      setApiError(getApiErrorMessage(err, t('common.errors.generic')));
    }
  });

  if (submitted) {
    return (
      <AuthPageLayout>
        <AuthFormCard
          title={t('auth.forgotPassword.title')}
          description={t('auth.forgotPassword.success')}
        >
          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">
              {t('auth.links.backToLogin')}
            </Link>
          </p>
        </AuthFormCard>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      <AuthFormCard
        title={t('auth.forgotPassword.title')}
        description={t('auth.forgotPassword.description')}
        formProps={{
          onSubmit: (event) => void onSubmit(event),
          'aria-busy': formState.isSubmitting,
        }}
        footer={
          <>
            <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
              {t('auth.actions.forgotPassword')}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-primary hover:underline">
                {t('auth.links.backToLogin')}
              </Link>
            </p>
          </>
        }
      >
        {apiError && (
          <p role="alert" className="text-sm text-destructive">
            {apiError}
          </p>
        )}
        <FormField
          id="forgot-password-email"
          label={t('auth.fields.email')}
          type="email"
          autoComplete="email"
          error={translateFieldError(getFormFieldError(formState.errors, 'email'), t)}
          {...register('email')}
        />
      </AuthFormCard>
    </AuthPageLayout>
  );
}
