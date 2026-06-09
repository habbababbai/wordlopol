import type { DeleteAccountRequestDto } from '@wordlopol/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { clearCsrfToken } from '@/api/csrf';
import { authKeys } from '@/api/query-keys';
import { clearAccessToken } from '@/api/token';

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: DeleteAccountRequestDto) => api.deleteAccount(body),
    onSuccess: () => {
      clearAccessToken();
      clearCsrfToken();
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
}
