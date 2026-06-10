import type { InfiniteWordDto } from '@wordlopol/shared';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '@/api/create-query-client';
import { gameKeys } from '@/api/query-keys';
import { useInfiniteNextQuery } from '@/hooks/queries/use-infinite-next-query';

const getInfiniteNextMock = vi.hoisted(() => vi.fn());

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    api: {
      ...(actual.api as Record<string, unknown>),
      getInfiniteNext: getInfiniteNextMock,
    },
  };
});

function createWrapper(queryClient = createQueryClient({ retry: false })) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useInfiniteNextQuery', () => {
  beforeEach(() => {
    getInfiniteNextMock.mockReset();
  });

  it('fetches next word on mount', async () => {
    const word: InfiniteWordDto = {
      date: '2026-06-09',
      wordNumber: 3,
      poolSize: 300,
      maxGuesses: 6,
      wordLength: 5,
    };
    getInfiniteNextMock.mockResolvedValueOnce(word);

    const queryClient = createQueryClient({ retry: false });
    const { result } = renderHook(() => useInfiniteNextQuery(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getInfiniteNextMock).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData<InfiniteWordDto>(gameKeys.infiniteNext())).toEqual(word);
  });
});
