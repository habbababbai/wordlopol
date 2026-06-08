import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import type { UserProfileDto } from '@wordlopol/shared';

import { api, tryRestoreSession } from '../api/client';
import { isPublicAuthPath } from '../lib/public-auth-paths';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      const profile = isPublicAuthPath(pathname) ? null : await tryRestoreSession();
      if (active && profile) {
        setUser(profile);
      }
      if (active) {
        setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [pathname]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: nextUser } = await api.login({ email, password });
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
