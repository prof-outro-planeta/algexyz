/** Returns a float in [0, 1), like `Math.random`. */
export type RandomSource = () => number;

export const defaultRandom: RandomSource = () => Math.random();

/** Integer in [min, max], both inclusive. */
export function randomInt(random: RandomSource, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

export function pick<T>(random: RandomSource, items: readonly T[]): T {
  if (items.length === 0) {
    throw new RangeError('Cannot pick from an empty list');
  }
  return items[randomInt(random, 0, items.length - 1)];
}

/** Fisher–Yates; returns a new array. */
export function shuffle<T>(random: RandomSource, items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(random, 0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Deterministic generator (mulberry32) for reproducible sequences in tests. */
export function seededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
