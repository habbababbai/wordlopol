import type { UserProfileResponseDto } from '@wordlopol/shared';
import { toUserProfile, toUserStats } from '../lib/user-profile.js';
import { prisma } from '../lib/prisma.js';

export class UserError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'UserError';
    this.statusCode = statusCode;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfileResponseDto> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { stats: true },
  });

  if (!user) {
    throw new UserError(404, 'User not found');
  }

  return {
    ...toUserProfile(user),
    stats: toUserStats(user.stats),
  };
}
