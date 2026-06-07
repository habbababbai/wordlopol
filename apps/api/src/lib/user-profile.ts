import type { UserProfileDto, UserStatsDto } from '@wordlopol/shared';

type UserProfileSource = {
  id: string;
  email: string;
  displayName: string;
  emailVerifiedAt: Date | null;
};

type UserStatsSource = {
  dailyPlayed: number;
  dailyWon: number;
  infinitePlayed: number;
  infiniteWon: number;
  bestTimedWords: number | null;
  bestTimedMs: number | null;
  bestTimedWord: string | null;
};

export function toUserProfile(user: UserProfileSource): UserProfileDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerifiedAt != null,
  };
}

export function toUserStats(stats: UserStatsSource | null | undefined): UserStatsDto {
  if (!stats) {
    return {
      dailyPlayed: 0,
      dailyWon: 0,
      infinitePlayed: 0,
      infiniteWon: 0,
      bestTimedWords: null,
      bestTimedMs: null,
      bestTimedWord: null,
    };
  }

  return {
    dailyPlayed: stats.dailyPlayed,
    dailyWon: stats.dailyWon,
    infinitePlayed: stats.infinitePlayed,
    infiniteWon: stats.infiniteWon,
    bestTimedWords: stats.bestTimedWords,
    bestTimedMs: stats.bestTimedMs,
    bestTimedWord: stats.bestTimedWord,
  };
}
