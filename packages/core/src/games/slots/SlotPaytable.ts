import type { Rng } from '../../random/Rng.ts';
import { WeightedTable } from '../../random/WeightedTable.ts';

export type SlotSymbol = 'cherry' | 'lemon' | 'bell' | 'bar' | 'seven';

export const SYMBOL_LABELS: Readonly<Record<SlotSymbol, string>> = {
  cherry: 'Cherry',
  lemon: 'Lemon',
  bell: 'Bell',
  bar: 'BAR',
  seven: '7',
};

/** Three identical weighted reels and what a line pays (multipliers include the stake). */
export class SlotPaytable {
  private readonly reel = new WeightedTable<SlotSymbol>([
    { value: 'cherry', weight: 6 },
    { value: 'lemon', weight: 5 },
    { value: 'bell', weight: 4 },
    { value: 'bar', weight: 3 },
    { value: 'seven', weight: 2 },
  ]);
  private readonly threeOfAKind: Readonly<Record<SlotSymbol, number>> = {
    seven: 100,
    bar: 30,
    bell: 15,
    lemon: 8,
    cherry: 5,
  };
  private readonly twoCherries = 2;

  spin(rng: Rng): SlotSymbol[] {
    return [this.reel.pick(rng), this.reel.pick(rng), this.reel.pick(rng)];
  }

  multiplier(line: readonly SlotSymbol[]): number {
    const [first] = line;
    if (first !== undefined && line.every((symbol) => symbol === first)) {
      return this.threeOfAKind[first];
    }
    return line.filter((symbol) => symbol === 'cherry').length === 2 ? this.twoCherries : 0;
  }

  /** Exact expected return, enumerating every combination of the three reels. */
  expectedReturn(): number {
    const stops = this.reel.entries;
    let total = 0;
    for (const a of stops) {
      for (const b of stops) {
        for (const c of stops) {
          const probability =
            this.reel.probabilityOf(a) * this.reel.probabilityOf(b) * this.reel.probabilityOf(c);
          total += probability * this.multiplier([a.value, b.value, c.value]);
        }
      }
    }
    return total;
  }
}
