import type { UserProfileResponseDto } from '@wordlopol/shared';

import { HttpError } from '../lib/http-error.js';
import { prisma } from '../lib/prisma.js';
import { toUserProfile, toUserStats } from '../lib/user-profile.js';

export async function getUserProfile(userId: string): Promise<UserProfileResponseDto> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { stats: true },
  });

  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND');
  }

  return {
    ...toUserProfile(user),
    stats: toUserStats(user.stats),
  };
}
