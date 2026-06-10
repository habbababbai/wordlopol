import type { GuessResultDto, InfiniteGuessRequestDto } from '@wordlopol/shared';
import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';

export function useInfiniteGuessMutation() {
  return useMutation<GuessResultDto, Error, InfiniteGuessRequestDto>({
    mutationFn: (body) => api.submitInfiniteGuess(body),
  });
}
