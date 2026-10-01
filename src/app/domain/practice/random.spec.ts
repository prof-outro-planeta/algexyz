import { pick, randomInt, seededRandom, shuffle } from './random';

describe('random helpers', () => {
  it('produces integers within inclusive bounds', () => {
    const random = seededRandom(1);
    for (let i = 0; i < 500; i++) {
      const value = randomInt(random, 3, 7);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(7);
    }
  });

  it('maps the edges of the random source to the bounds', () => {
    expect(randomInt(() => 0, 1, 4)).toBe(1);
    expect(randomInt(() => 0.9999, 1, 4)).toBe(4);
  });

  it('shuffles without losing or duplicating items', () => {
    const items = [1, 2, 3, 4, 5];
    const shuffled = shuffle(seededRandom(2), items);

    expect([...shuffled].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });

  it('refuses to pick from an empty list', () => {
    expect(() => pick(seededRandom(1), [])).toThrow(RangeError);
  });
});
