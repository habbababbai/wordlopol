import type { ResetPasswordRequestDto } from '@wordlopol/shared';
import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (body: ResetPasswordRequestDto) => api.resetPassword(body),
  });
}
