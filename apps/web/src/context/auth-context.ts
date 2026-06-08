import type { UserProfileDto } from '@wordlopol/shared';
import { createContext } from 'react';

export type AuthContextValue = {
  user: UserProfileDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
