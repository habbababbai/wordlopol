import { pickWordIndexForDate } from './daily.js';

function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function nextRandom(state: { value: number }, seed: string, counter: number): number {
  state.value = fnv1a32(`${seed}:${counter}:${state.value}`);
  return state.value;
}

/**
 * Picks a deterministic dictionary index for one slot in the shared daily pool.
 * All players see the same pool for a given Warsaw calendar date; `order` (0..poolSize-1)
 * selects which slot is being filled. Salting via a higher `order` argument resolves
 * hash collisions when building unique pools.
 */
export function pickPoolWordIndexForDate(
  dateKey: string,
  order: number,
  wordCount: number,
): number {
  return pickWordIndexForDate(`${dateKey}:${order}`, wordCount);
}

/**
 * Fisher-Yates shuffle of `[0, length)` using a seed-derived PRNG.
 * Same seed always yields the same permutation — used to vary word order per player and cycle.
 */
export function seededShuffle(length: number, seed: string): number[] {
  if (length <= 0) {
    return [];
  }

  const indices = Array.from({ length }, (_, i) => i);
  const state = { value: fnv1a32(seed) };

  for (let i = length - 1; i > 0; i--) {
    const random = nextRandom(state, seed, i);
    const j = random % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices;
}

/**
 * Returns the next unused pool slot for the current cycle.
 * Walks a seeded permutation and skips indices already in `usedOrders`.
 * Returns `null` when every slot has been played (caller should start a new cycle).
 */
export function buildCyclePickOrder(
  poolSize: number,
  usedOrders: ReadonlySet<number>,
  seed: string,
): number | null {
  const shuffled = seededShuffle(poolSize, seed);

  for (const order of shuffled) {
    if (!usedOrders.has(order)) {
      return order;
    }
  }

  return null;
}
