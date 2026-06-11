import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { authKeys } from '@/api/query-keys';

export function useLogoutAllMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.logoutAll(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
}
