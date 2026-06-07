export type LetterResult = 'correct' | 'present' | 'absent';

export type GameMode = 'DAILY' | 'INFINITE' | 'TIMED';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;
export const INFINITE_POOL_SIZE = 300;

export interface DailyChallengeDto {
  date: string;
  maxGuesses: number;
  wordLength: number;
}

export interface InfiniteWordDto {
  /** Warsaw calendar date (YYYY-MM-DD). */
  date: string;
  /** 1-based count of finished words today in the current cycle, plus the in-progress word. */
  wordNumber: number;
  /** Size of today's shared pool (≤ INFINITE_POOL_SIZE). */
  poolSize: number;
  maxGuesses: number;
  wordLength: number;
}

export interface GuessResultDto {
  results: LetterResult[];
  won: boolean;
  finished: boolean;
  guessNumber: number;
  /** Present only when the game is finished (win or sixth guess). */
  answer?: string;
}

export interface UserProfileDto {
  id: string;
  email: string;
  displayName: string;
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
