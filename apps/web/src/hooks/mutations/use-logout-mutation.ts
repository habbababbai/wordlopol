import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { authKeys } from '@/api/query-keys';

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
}
