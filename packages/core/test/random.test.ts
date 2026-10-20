import { describe, expect, it } from 'vitest';
import type { Rng } from '../src/random/Rng.ts';
import { SeededRng } from '../src/random/SeededRng.ts';
import { WeightedTable } from '../src/random/WeightedTable.ts';

const draw = (rng: Rng, count: number): number[] => Array.from({ length: count }, () => rng.next());

describe('SeededRng', () => {
  it('repeats the same sequence for the same seed', () => {
    expect(draw(new SeededRng(42), 5)).toEqual(draw(new SeededRng(42), 5));
    expect(draw(new SeededRng(42), 5)).not.toEqual(draw(new SeededRng(43), 5));
    expect(draw(new SeededRng(9).fork(), 3)).toEqual(draw(new SeededRng(9).fork(), 3));
  });

  it('stays in range and spreads evenly', () => {
    const rng = new SeededRng(7);
    const buckets = new Array<number>(10).fill(0);
    for (let i = 0; i < 100_000; i++) {
      const value = rng.int(10);
      buckets[value] = (buckets[value] ?? 0) + 1;
    }
    for (const count of buckets) {
      expect(count).toBeGreaterThan(9_500);
      expect(count).toBeLessThan(10_500);
    }
  });

  it('rejects bad bounds and empty picks', () => {
    expect(() => new SeededRng(1).int(0)).toThrow(RangeError);
    expect(() => new SeededRng(1).pick([])).toThrow(RangeError);
  });
});

describe('WeightedTable', () => {
  it('picks in proportion to weight', () => {
    const table = new WeightedTable([
      { value: 'a', weight: 3 },
      { value: 'b', weight: 1 },
    ]);
    const rng = new SeededRng(3);
    let picksOfA = 0;
    for (let i = 0; i < 40_000; i++) if (table.pick(rng) === 'a') picksOfA++;
    expect(picksOfA / 40_000).toBeCloseTo(0.75, 1);
  });
});
