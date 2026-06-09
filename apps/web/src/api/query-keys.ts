export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

export const gameKeys = {
  all: ['game'] as const,
  dailyToday: () => [...gameKeys.all, 'daily', 'today'] as const,
};
