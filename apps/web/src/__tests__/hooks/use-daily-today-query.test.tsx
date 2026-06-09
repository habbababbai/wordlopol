import type { DailyChallengeDto } from '@wordlopol/shared';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '@/api/create-query-client';
import { gameKeys } from '@/api/query-keys';
import { useDailyTodayQuery } from '@/hooks/queries/use-daily-today-query';

const getDailyTodayMock = vi.hoisted(() => vi.fn());

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    api: {
      ...(actual.api as Record<string, unknown>),
      getDailyToday: getDailyTodayMock,
    },
  };
});

function createWrapper(queryClient = createQueryClient({ retry: false })) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useDailyTodayQuery', () => {
  beforeEach(() => {
    getDailyTodayMock.mockReset();
  });

  it('fetches today challenge on mount', async () => {
    const challenge: DailyChallengeDto = {
      date: '2026-06-09',
      maxGuesses: 6,
      wordLength: 5,
    };
    getDailyTodayMock.mockResolvedValueOnce(challenge);

    const queryClient = createQueryClient({ retry: false });
    const { result } = renderHook(() => useDailyTodayQuery(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getDailyTodayMock).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData<DailyChallengeDto>(gameKeys.dailyToday())).toEqual(challenge);
  });
});
