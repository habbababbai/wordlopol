import type { UserProfileDto, UserProfileResponseDto } from '@wordlopol/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { authKeys } from '@/api/query-keys';

type LoginVariables = {
  email: string;
  password: string;
};

function sessionFromLoginUser(user: UserProfileDto): UserProfileResponseDto {
  return {
    ...user,
    stats: {
      dailyPlayed: 0,
      dailyWon: 0,
      infinitePlayed: 0,
      infiniteWon: 0,
      bestTimedWords: null,
      bestTimedMs: null,
      bestTimedWord: null,
    },
  };
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: LoginVariables) => api.login({ email, password }),
    onSuccess: (session) => {
      queryClient.setQueryData(authKeys.session(), sessionFromLoginUser(session.user));
      void queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
  });
}
