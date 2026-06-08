import type { UserProfileResponseDto } from '@wordlopol/shared';
import { useQuery } from '@tanstack/react-query';

import { sessionQueryOptions } from '@/hooks/queries/use-session-query';
import { useAuthUiStore } from '@/stores/auth-ui-store';

export type AuthState = {
  user: UserProfileResponseDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export function useAuth(): AuthState {
  const sessionChecked = useAuthUiStore((state) => state.sessionChecked);
  const { data } = useQuery({ ...sessionQueryOptions(), enabled: false });

  return {
    user: data ?? null,
    isAuthenticated: data != null,
    isLoading: !sessionChecked,
  };
}
