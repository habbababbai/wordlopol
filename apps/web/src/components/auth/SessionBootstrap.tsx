import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useSessionQuery } from '@/hooks/queries/use-session-query';
import { isPublicAuthPath } from '@/lib/public-auth-paths';
import { useAuthUiStore } from '@/stores/auth-ui-store';

export function SessionBootstrap() {
  const { pathname } = useLocation();
  const setSessionChecked = useAuthUiStore((state) => state.setSessionChecked);
  const skipRestore = isPublicAuthPath(pathname);

  const { isFetched } = useSessionQuery(!skipRestore);

  useEffect(() => {
    if (skipRestore) {
      setSessionChecked(true);
      return;
    }

    if (isFetched) {
      setSessionChecked(true);
    }
  }, [skipRestore, isFetched, setSessionChecked]);

  return null;
}
