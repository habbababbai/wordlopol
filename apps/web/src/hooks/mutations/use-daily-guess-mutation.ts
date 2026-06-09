import type { DailyGuessRequestDto } from '@wordlopol/shared';
import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';

export function useDailyGuessMutation() {
  return useMutation({
    mutationFn: (body: DailyGuessRequestDto) => api.submitDailyGuess(body),
  });
}
