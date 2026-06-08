import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authKeys } from '@/api/query-keys';
import { useAuth } from '@/hooks/useAuth';

type LoginVariables = {
  email: string;
  password: string;
};

export function useLoginMutation() {
  const { login } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: LoginVariables) => login(email, password),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}
