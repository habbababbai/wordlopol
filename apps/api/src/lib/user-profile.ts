import type { UserProfileDto } from '@wordlopol/shared';

type UserProfileSource = {
  id: string;
  email: string;
  displayName: string;
  emailVerifiedAt: Date | null;
};

export function toUserProfile(user: UserProfileSource): UserProfileDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerifiedAt != null,
  };
}
