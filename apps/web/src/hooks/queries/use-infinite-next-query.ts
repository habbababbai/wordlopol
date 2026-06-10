import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { gameKeys } from '@/api/query-keys';

export function infiniteNextQueryOptions() {
  return queryOptions({
    queryKey: gameKeys.infiniteNext(),
    queryFn: () => api.getInfiniteNext(),
  });
}

export function useInfiniteNextQuery() {
  return useQuery(infiniteNextQueryOptions());
}
