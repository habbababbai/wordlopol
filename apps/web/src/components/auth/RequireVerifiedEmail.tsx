import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router-dom';

import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { useAuth } from '@/hooks/useAuth';

export function RequireVerifiedEmail() {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (user && !user.emailVerified) {
    return (
      <AuthPageLayout>
        <AuthFormCard
          title={t('auth.verifyEmail.title')}
          description={t('auth.guards.emailNotVerified')}
        >
          <p className="text-sm text-muted-foreground">
            <Link to="/verify-email" className="font-medium text-primary hover:underline">
              {t('auth.guards.verifyEmailLink')}
            </Link>
          </p>
        </AuthFormCard>
      </AuthPageLayout>
    );
  }

  return <Outlet />;
}
