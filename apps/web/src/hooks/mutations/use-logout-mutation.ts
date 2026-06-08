import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
