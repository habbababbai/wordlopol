import { queryOptions, useQuery } from '@tanstack/react-query';

import { tryRestoreSession } from '@/api/client';
import { authKeys } from '@/api/query-keys';

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: authKeys.session(),
    queryFn: tryRestoreSession,
    retry: false,
  });
}

export function useSessionQuery(enabled = false) {
  return useQuery({
    ...sessionQueryOptions(),
    enabled,
  });
}
