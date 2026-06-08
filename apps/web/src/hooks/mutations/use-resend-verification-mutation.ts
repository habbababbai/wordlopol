import type { EmailOnlyRequestDto } from '@wordlopol/shared';
import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';

export function useResendVerificationMutation() {
  return useMutation({
    mutationFn: (body: EmailOnlyRequestDto) => api.resendVerification(body),
  });
}
