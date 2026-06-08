import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { authKeys } from '@/api/query-keys';
import { useAuth } from '@/hooks/useAuth';

export function profileQueryOptions() {
  return queryOptions({
    queryKey: authKeys.profile(),
    queryFn: () => api.getProfile(),
  });
}

export function useProfileQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    ...profileQueryOptions(),
    enabled: isAuthenticated,
  });
}
