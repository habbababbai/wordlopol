import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { gameKeys } from '@/api/query-keys';

export function dailyTodayQueryOptions() {
  return queryOptions({
    queryKey: gameKeys.dailyToday(),
    queryFn: () => api.getDailyToday(),
  });
}

export function useDailyTodayQuery() {
  return useQuery(dailyTodayQueryOptions());
}
