import { QueryClient } from '@tanstack/react-query';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

type CreateQueryClientOptions = {
  retry?: boolean | number;
};

export function createQueryClient(options: CreateQueryClientOptions = {}): QueryClient {
  const retry = options.retry ?? 1;

  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: FIVE_MINUTES_MS,
        gcTime: TEN_MINUTES_MS,
        refetchOnWindowFocus: false,
        retry,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
