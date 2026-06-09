import type { ChangeEmailRequestDto } from '@wordlopol/shared';
import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';

export function useChangeEmailMutation() {
  return useMutation({
    mutationFn: (body: ChangeEmailRequestDto) => api.changeEmail(body),
  });
}
