import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '@/api/create-query-client';
import { authKeys } from '@/api/query-keys';
import { useLogoutMutation } from '@/hooks/mutations/use-logout-mutation';

const logoutMock = vi.hoisted(() => vi.fn());

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    api: {
      ...(actual.api as Record<string, unknown>),
      logout: logoutMock,
    },
  };
});

function createWrapper(queryClient = createQueryClient({ retry: false })) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useLogoutMutation', () => {
  beforeEach(() => {
    logoutMock.mockReset();
  });

  it('calls logout and clears query cache', async () => {
    logoutMock.mockResolvedValueOnce({ message: 'Logged out' });

    const queryClient = createQueryClient({ retry: false });
    queryClient.setQueryData(authKeys.session(), { id: 'user-1' });

    const { result } = renderHook(() => useLogoutMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync();

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledTimes(1);
      expect(queryClient.getQueryData(authKeys.session())).toBeUndefined();
    });
  });
});
