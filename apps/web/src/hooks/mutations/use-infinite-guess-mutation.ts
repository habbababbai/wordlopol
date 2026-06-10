import type { InfiniteGuessRequestDto } from '@wordlopol/shared';
import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';

export function useInfiniteGuessMutation() {
  return useMutation({
    mutationFn: (body: InfiniteGuessRequestDto) => api.submitInfiniteGuess(body),
  });
}
