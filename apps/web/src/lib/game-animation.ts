export const TILE_FLIP_DELAY_MS = 100;
const TILE_FLIP_DURATION_MS = 500;

export function getRowRevealDurationMs(wordLength: number): number {
  const safeWordLength = Math.max(1, wordLength);
  const lastTileDelayMs = (safeWordLength - 1) * TILE_FLIP_DELAY_MS;
  return lastTileDelayMs + TILE_FLIP_DURATION_MS;
}
