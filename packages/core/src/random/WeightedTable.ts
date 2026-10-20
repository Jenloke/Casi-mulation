import type { Rng } from './Rng.ts';

export interface Weighted<T> {
  readonly value: T;
  readonly weight: number;
}

/** Picks values with probability proportional to their weight. */
export class WeightedTable<T> {
  readonly entries: readonly Weighted<T>[];
  readonly totalWeight: number;

  constructor(entries: readonly Weighted<T>[]) {
    if (entries.length === 0) throw new RangeError('A weighted table needs at least one entry');
    if (entries.some((entry) => !(entry.weight > 0))) {
      throw new RangeError('Weights must be positive');
    }
    this.entries = entries;
    this.totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  }

  pick(rng: Rng): T {
    let roll = rng.next() * this.totalWeight;
    for (const entry of this.entries) {
      roll -= entry.weight;
      if (roll < 0) return entry.value;
    }
    return this.lastValue();
  }

  probabilityOf(entry: Weighted<T>): number {
    return entry.weight / this.totalWeight;
  }

  private lastValue(): T {
    const last = this.entries.at(-1);
    if (!last) throw new RangeError('Empty weighted table');
    return last.value;
  }
}
