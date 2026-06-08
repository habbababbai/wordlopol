import type { UserProfileResponseDto } from '@wordlopol/shared';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '@/api/create-query-client';
import { authKeys } from '@/api/query-keys';
import { useProfileQuery } from '@/hooks/queries/use-profile-query';

const getProfileMock = vi.hoisted(() => vi.fn());

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    api: {
      ...(actual.api as Record<string, unknown>),
      getProfile: getProfileMock,
    },
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';

const useAuthMock = vi.mocked(useAuth);

function createWrapper(queryClient = createQueryClient({ retry: false })) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useProfileQuery', () => {
  beforeEach(() => {
    getProfileMock.mockReset();
    useAuthMock.mockReset();
  });

  it('does not fetch when user is not authenticated', () => {
    useAuthMock.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    renderHook(() => useProfileQuery(), { wrapper: createWrapper() });

    expect(getProfileMock).not.toHaveBeenCalled();
  });

  it('fetches profile when user is authenticated', async () => {
    useAuthMock.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'player@example.com',
        displayName: 'Player',
        emailVerified: true,
        stats: {
          dailyPlayed: 1,
          dailyWon: 1,
          infinitePlayed: 0,
          infiniteWon: 0,
          bestTimedWords: null,
          bestTimedMs: null,
          bestTimedWord: null,
        },
      },
      isAuthenticated: true,
      isLoading: false,
    });

    getProfileMock.mockResolvedValueOnce({
      id: 'user-1',
      email: 'player@example.com',
      displayName: 'Player',
      emailVerified: true,
      stats: {
        dailyPlayed: 2,
        dailyWon: 2,
        infinitePlayed: 0,
        infiniteWon: 0,
        bestTimedWords: null,
        bestTimedMs: null,
        bestTimedWord: null,
      },
    });

    const queryClient = createQueryClient({ retry: false });
    const { result } = renderHook(() => useProfileQuery(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getProfileMock).toHaveBeenCalledTimes(1);
    const profile = queryClient.getQueryData<UserProfileResponseDto>(authKeys.profile());
    expect(profile?.stats.dailyPlayed).toBe(2);
  });
});
