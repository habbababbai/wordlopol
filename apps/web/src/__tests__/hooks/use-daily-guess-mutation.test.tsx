import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '@/api/create-query-client';
import { useDailyGuessMutation } from '@/hooks/mutations/use-daily-guess-mutation';

const submitDailyGuessMock = vi.hoisted(() => vi.fn());

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    api: {
      ...(actual.api as Record<string, unknown>),
      submitDailyGuess: submitDailyGuessMock,
    },
  };
});

function createWrapper(queryClient = createQueryClient({ retry: false })) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useDailyGuessMutation', () => {
  beforeEach(() => {
    submitDailyGuessMock.mockReset();
  });

  it('submits guess via API client', async () => {
    const body = { guess: 'mleko' };
    const response = {
      results: ['absent', 'present', 'absent', 'absent', 'correct'],
      won: false,
      finished: false,
      guessNumber: 1,
    };
    submitDailyGuessMock.mockResolvedValueOnce(response);

    const { result } = renderHook(() => useDailyGuessMutation(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(body);

    await waitFor(() => {
      expect(submitDailyGuessMock).toHaveBeenCalledWith(body);
      expect(result.current.data).toEqual(response);
    });
  });
});
