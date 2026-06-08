import type { RegisterRequestDto } from '@wordlopol/shared';
import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (body: RegisterRequestDto) => api.register(body),
  });
}
