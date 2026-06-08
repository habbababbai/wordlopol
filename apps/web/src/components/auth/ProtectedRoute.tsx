import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { Spinner } from '@/components/ui/loader';
import { useAuth } from '@/hooks/useAuth';

function buildLoginPath(pathname: string, search: string): string {
  const returnTo = encodeURIComponent(pathname + search);
  return returnTo && returnTo !== '%2F' ? `/login?returnTo=${returnTo}` : '/login';
}

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={buildLoginPath(location.pathname, location.search)}
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}
