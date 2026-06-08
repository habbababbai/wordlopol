import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { useResetPasswordMutation } from '../hooks/mutations/use-reset-password-mutation';
import { AuthFormCard } from '../components/auth/AuthFormCard';
import { AuthPageLayout } from '../components/auth/AuthPageLayout';
import { FormField } from '../components/auth/FormField';
import { Button } from '../components/ui/button';
import { getApiErrorMessage } from '../lib/api-error-message';
import type { ResetPasswordFormValues } from '../lib/auth-form-types';
import { resetPasswordSchema } from '../lib/auth-schemas';
import { getFormFieldError, translateFieldError } from '../lib/field-error';

const REDIRECT_DELAY_MS = 2000;

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const resetPasswordMutation = useResetPasswordMutation();
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => {
      void navigate('/login');
    }, REDIRECT_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success, navigate]);

  const onSubmit = handleSubmit(async (values: ResetPasswordFormValues) => {
    if (!token) {
      return;
    }

    setApiError(null);

    try {
      await resetPasswordMutation.mutateAsync({ token, password: values.password });
      setSuccess(true);
    } catch (err) {
      setApiError(getApiErrorMessage(err, t('common.errors.generic')));
    }
  });

  if (!token) {
    return (
      <AuthPageLayout>
        <AuthFormCard
          title={t('auth.resetPassword.title')}
          description={t('auth.resetPassword.description')}
        >
          <p role="alert" className="text-sm text-destructive">
            {t('auth.errors.missingToken')}
          </p>
          <p className="text-sm text-muted-foreground">
            <Link to="/forgot-password" className="font-medium text-primary hover:underline">
              {t('auth.actions.forgotPassword')}
            </Link>
          </p>
        </AuthFormCard>
      </AuthPageLayout>
    );
  }

  if (success) {
    return (
      <AuthPageLayout>
        <AuthFormCard
          title={t('auth.resetPassword.title')}
          description={t('auth.resetPassword.success')}
        >
          <span className="sr-only">{t('auth.resetPassword.success')}</span>
        </AuthFormCard>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      <AuthFormCard
        title={t('auth.resetPassword.title')}
        description={t('auth.resetPassword.description')}
        formProps={{
          onSubmit: (event) => void onSubmit(event),
          'aria-busy': formState.isSubmitting || resetPasswordMutation.isPending,
        }}
        footer={
          <Button
            type="submit"
            className="w-full"
            disabled={formState.isSubmitting || resetPasswordMutation.isPending}
          >
            {t('auth.actions.resetPassword')}
          </Button>
        }
      >
        {apiError && (
          <p role="alert" className="text-sm text-destructive">
            {apiError}
          </p>
        )}
        <FormField
          id="reset-password"
          label={t('auth.fields.newPassword')}
          type="password"
          autoComplete="new-password"
          error={translateFieldError(getFormFieldError(formState.errors, 'password'), t)}
          {...register('password')}
        />
        <FormField
          id="reset-confirm-password"
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
