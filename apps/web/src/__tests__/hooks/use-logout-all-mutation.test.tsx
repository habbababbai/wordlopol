import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '@/api/create-query-client';
import { authKeys } from '@/api/query-keys';
import { useLogoutAllMutation } from '@/hooks/mutations/use-logout-all-mutation';

const logoutAllMock = vi.hoisted(() => vi.fn());

vi.mock('@/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    api: {
      ...(actual.api as Record<string, unknown>),
      logoutAll: logoutAllMock,
    },
  };
});

function createWrapper(queryClient = createQueryClient({ retry: false })) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useLogoutAllMutation', () => {
  beforeEach(() => {
    logoutAllMock.mockReset();
  });

  it('calls logoutAll and clears query cache', async () => {
    logoutAllMock.mockResolvedValueOnce({ message: 'Logged out from all devices' });

    const queryClient = createQueryClient({ retry: false });
    queryClient.setQueryData(authKeys.session(), { id: 'user-1' });

    const { result } = renderHook(() => useLogoutAllMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync();

    await waitFor(() => {
      expect(logoutAllMock).toHaveBeenCalledTimes(1);
      expect(queryClient.getQueryData(authKeys.session())).toBeUndefined();
    });
  });
});
