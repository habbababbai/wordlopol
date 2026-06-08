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
import type { RegisterFormValues } from '../lib/auth-form-types';
import { registerSchema } from '../lib/auth-schemas';
import { getFormFieldError, translateFieldError } from '../lib/field-error';

type RegisterSuccess = {
  devToken?: string;
};

export function RegisterPage() {
  const { t } = useTranslation();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<RegisterSuccess | null>(null);

  const { register, handleSubmit, formState } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      displayName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values: RegisterFormValues) => {
    setApiError(null);

    try {
      const result = await api.register({
        email: values.email,
        displayName: values.displayName,
        password: values.password,
      });
      setSuccess({ devToken: result.devToken });
    } catch (err) {
      setApiError(getApiErrorMessage(err, t('common.errors.generic')));
    }
  });

  if (success) {
    const devVerifyUrl =
      import.meta.env.DEV && success.devToken
        ? `/verify-email?token=${encodeURIComponent(success.devToken)}`
        : null;

    return (
      <AuthPageLayout>
        <AuthFormCard
          title={t('auth.register.successTitle')}
          description={t('auth.register.successDescription')}
        >
          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">
              {t('auth.links.toLogin')}
            </Link>
          </p>
          {devVerifyUrl && (
            <p className="text-sm text-muted-foreground">
              <Link to={devVerifyUrl} className="font-medium text-primary hover:underline">
                {t('auth.register.devVerifyLink')}
              </Link>
            </p>
          )}
        </AuthFormCard>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      <AuthFormCard
        title={t('auth.register.title')}
        description={t('auth.register.description')}
        formProps={{
          onSubmit: (event) => void onSubmit(event),
          'aria-busy': formState.isSubmitting,
        }}
        footer={
          <>
            <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
              {t('auth.actions.register')}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-primary hover:underline">
                {t('auth.links.toLogin')}
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
          id="register-email"
          label={t('auth.fields.email')}
          type="email"
          autoComplete="email"
          error={translateFieldError(getFormFieldError(formState.errors, 'email'), t)}
          {...register('email')}
        />
        <FormField
          id="register-display-name"
          label={t('auth.fields.displayName')}
          type="text"
          autoComplete="nickname"
          error={translateFieldError(getFormFieldError(formState.errors, 'displayName'), t)}
          {...register('displayName')}
        />
        <FormField
          id="register-password"
          label={t('auth.fields.password')}
          type="password"
          autoComplete="new-password"
          error={translateFieldError(getFormFieldError(formState.errors, 'password'), t)}
          {...register('password')}
        />
        <FormField
          id="register-confirm-password"
          label={t('auth.fields.confirmPassword')}
          type="password"
          autoComplete="new-password"
          error={translateFieldError(getFormFieldError(formState.errors, 'confirmPassword'), t)}
          {...register('confirmPassword')}
        />
      </AuthFormCard>
    </AuthPageLayout>
  );
}
