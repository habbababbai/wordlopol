import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { UserProfileDto } from '@wordlopol/shared';

import { api, tryRestoreSession } from '../api/client';
import { AuthContext } from './auth-context';

function toUserProfile(profile: {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}): UserProfileDto {
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    emailVerified: profile.emailVerified,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const profile = await tryRestoreSession();
      if (!cancelled && profile) {
        setUser(toUserProfile(profile));
      }
      if (!cancelled) {
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: nextUser } = await api.login({ email, password });
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
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
