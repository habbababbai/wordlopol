import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';

import { api } from '../api/client';
import { AuthFormCard } from '../components/auth/AuthFormCard';
import { AuthPageLayout } from '../components/auth/AuthPageLayout';
import { FormField } from '../components/auth/FormField';
import { Spinner } from '../components/ui/loader';
import { Button } from '../components/ui/button';
import { getApiErrorMessage } from '../lib/api-error-message';
import type { EmailOnlyFormValues } from '../lib/auth-form-types';
import { emailOnlySchema } from '../lib/auth-schemas';
import { getFormFieldError, translateFieldError } from '../lib/field-error';

type VerifyStatus = 'idle' | 'verifying' | 'success' | 'error';

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const verifyStarted = useRef(false);

  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>(token ? 'verifying' : 'idle');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<EmailOnlyFormValues>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    if (!token || verifyStarted.current) {
      return;
    }

    verifyStarted.current = true;
    let cancelled = false;

    void (async () => {
      try {
        await api.verifyEmail({ token });
        if (!cancelled) {
          setVerifyStatus('success');
        }
      } catch {
        if (!cancelled) {
          setVerifyStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const onResend = handleSubmit(async (values: EmailOnlyFormValues) => {
    setResendError(null);
    setResendSuccess(false);

    try {
      await api.resendVerification({ email: values.email });
      setResendSuccess(true);
    } catch (err) {
      setResendError(getApiErrorMessage(err, t('common.errors.generic')));
    }
  });

  if (verifyStatus === 'verifying') {
    return (
      <AuthPageLayout>
        <AuthFormCard
          title={t('auth.verifyEmail.title')}
          description={t('auth.verifyEmail.description')}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner size="sm" />
            <span>{t('auth.verifyEmail.verifying')}</span>
          </div>
        </AuthFormCard>
      </AuthPageLayout>
    );
  }

  if (verifyStatus === 'success') {
    return (
      <AuthPageLayout>
        <AuthFormCard
          title={t('auth.verifyEmail.title')}
          description={t('auth.verifyEmail.success')}
        >
          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">
              {t('auth.links.toLogin')}
            </Link>
          </p>
        </AuthFormCard>
      </AuthPageLayout>
    );
  }

  const showVerifyError = verifyStatus === 'error';

  return (
    <AuthPageLayout>
      <AuthFormCard
        title={t('auth.verifyEmail.title')}
        description={
          showVerifyError ? t('auth.verifyEmail.error') : t('auth.verifyEmail.description')
        }
        formProps={{
          onSubmit: (event) => void onResend(event),
          'aria-busy': formState.isSubmitting,
        }}
        footer={
          <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
            {t('auth.actions.resendVerification')}
          </Button>
        }
      >
        <h2 className="text-sm font-semibold text-foreground">
          {t('auth.verifyEmail.resendTitle')}
        </h2>

        {showVerifyError && (
          <p role="alert" className="text-sm text-destructive">
            {t('auth.verifyEmail.error')}
          </p>
        )}

        {resendSuccess && (
          <p role="status" className="text-sm text-muted-foreground">
            {t('auth.verifyEmail.resendSuccess')}
          </p>
        )}

        {resendError && (
          <p role="alert" className="text-sm text-destructive">
            {resendError}
          </p>
        )}

        <FormField
          id="verify-email"
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
