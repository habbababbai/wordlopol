import type { VerifyEmailRequestDto } from '@wordlopol/shared';
import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';

const verifyRequests = new Map<string, Promise<void>>();

export function verifyEmailOnce(token: string): Promise<void> {
  const existing = verifyRequests.get(token);
  if (existing) {
    return existing;
  }

  const request = api
    .verifyEmail({ token })
    .then(() => undefined)
    .finally(() => {
      verifyRequests.delete(token);
    });

  verifyRequests.set(token, request);
  return request;
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: (body: VerifyEmailRequestDto) => verifyEmailOnce(body.token),
  });
}
