import { createHash } from 'node:crypto';

export function pickWordIndexForDate(dateKey: string, wordCount: number): number {
  if (wordCount <= 0) {
    throw new Error('wordCount must be greater than 0');
  }

  const hash = createHash('sha256').update(dateKey).digest();
  const index = hash.readUInt32BE(0) % wordCount;
  return index;
}
