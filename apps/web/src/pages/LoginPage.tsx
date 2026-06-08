import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { AuthFormCard } from '../components/auth/AuthFormCard';
import { AuthPageLayout } from '../components/auth/AuthPageLayout';
import { FormField } from '../components/auth/FormField';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../lib/api-error-message';
import type { LoginFormValues } from '../lib/auth-form-types';
import { loginSchema } from '../lib/auth-schemas';
import { getFormFieldError, translateFieldError } from '../lib/field-error';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values: LoginFormValues) => {
    setApiError(null);

    try {
      await login(values.email, values.password);
      const returnTo = searchParams.get('returnTo');
      void navigate(returnTo && returnTo.startsWith('/') ? returnTo : '/');
    } catch (err) {
      setApiError(getApiErrorMessage(err, t('common.errors.generic')));
    }
  });

  return (
    <AuthPageLayout>
      <AuthFormCard
        title={t('auth.login.title')}
        description={t('auth.login.description')}
        formProps={{
          onSubmit: (event) => void onSubmit(event),
          'aria-busy': formState.isSubmitting,
        }}
        footer={
          <>
            <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
              {t('auth.actions.login')}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/forgot-password" className="font-medium text-primary hover:underline">
                {t('auth.links.forgotPassword')}
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/register" className="font-medium text-primary hover:underline">
                {t('auth.links.toRegister')}
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
          id="login-email"
          label={t('auth.fields.email')}
          type="email"
          autoComplete="email"
          error={translateFieldError(getFormFieldError(formState.errors, 'email'), t)}
          {...register('email')}
        />
        <FormField
          id="login-password"
          label={t('auth.fields.password')}
          type="password"
          autoComplete="current-password"
          error={translateFieldError(getFormFieldError(formState.errors, 'password'), t)}
          {...register('password')}
        />
      </AuthFormCard>
    </AuthPageLayout>
  );
}
