function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function pickWordIndexForDate(dateKey: string, wordCount: number): number {
  if (wordCount <= 0) {
    throw new Error('wordCount must be greater than 0');
  }

  return fnv1a32(dateKey) % wordCount;
}
