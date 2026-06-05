export type LetterResult = 'correct' | 'present' | 'absent';

export type GameMode = 'DAILY' | 'INFINITE' | 'TIMED';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export interface DailyChallengeDto {
  date: string;
  maxGuesses: number;
  wordLength: number;
}

export interface GuessResultDto {
  results: LetterResult[];
  won: boolean;
  finished: boolean;
  guessNumber: number;
}

export interface UserProfileDto {
  id: string;
  email: string;
  displayName: string | null;
  emailVerified: boolean;
}

export interface UserStatsDto {
  dailyPlayed: number;
  dailyWon: number;
  infinitePlayed: number;
  infiniteWon: number;
  bestTimedWords: number | null;
  bestTimedMs: number | null;
  bestTimedWord: string | null;
}

export interface AuthResponseDto {
  accessToken: string;
  user: UserProfileDto;
}
