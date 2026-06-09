import type {
  ChangeDisplayNameRequestDto,
  UserProfileDto,
  UserProfileResponseDto,
} from '@wordlopol/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { authKeys } from '@/api/query-keys';

function mergeUserIntoProfile(
  user: UserProfileDto,
  existing: UserProfileResponseDto | undefined,
): UserProfileResponseDto {
  return {
    ...user,
    stats: existing?.stats ?? {
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

export function useChangeDisplayNameMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ChangeDisplayNameRequestDto) => api.changeDisplayName(body),
    onSuccess: (response) => {
      const profile = queryClient.getQueryData<UserProfileResponseDto>(authKeys.profile());
      const session = queryClient.getQueryData<UserProfileResponseDto>(authKeys.session());
      const updatedProfile = mergeUserIntoProfile(response.user, profile);
      const updatedSession = mergeUserIntoProfile(response.user, session);

      queryClient.setQueryData(authKeys.profile(), updatedProfile);
      queryClient.setQueryData(authKeys.session(), updatedSession);
    },
  });
}
