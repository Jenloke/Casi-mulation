import type { Rng } from '../../random/Rng.ts';

export type OutsideBet = 'red' | 'black' | 'odd' | 'even' | 'low' | 'high';

export type RouletteBet =
  | { readonly kind: OutsideBet }
  | { readonly kind: 'straight'; readonly number: number };

export const POCKETS = 37;

const RED_NUMBERS: ReadonlySet<number> = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);
const OUTSIDE_BETS: readonly OutsideBet[] = ['red', 'black', 'odd', 'even', 'low', 'high'];

/** European single-zero wheel: spins, colours and which bets a pocket wins. */
export class RouletteWheel {
  spin(rng: Rng): number {
    return rng.int(POCKETS);
  }

  color(pocket: number): 'red' | 'black' | 'green' {
    if (pocket === 0) return 'green';
    return RED_NUMBERS.has(pocket) ? 'red' : 'black';
  }

  /** Stake multiplier paid on a win, stake included. */
  multiplier(bet: RouletteBet): number {
    return bet.kind === 'straight' ? 36 : 2;
  }

  wins(bet: RouletteBet, pocket: number): boolean {
    if (bet.kind === 'straight') return bet.number === pocket;
    if (pocket === 0) return false;
    switch (bet.kind) {
      case 'red':
        return this.color(pocket) === 'red';
      case 'black':
        return this.color(pocket) === 'black';
      case 'odd':
        return pocket % 2 === 1;
      case 'even':
        return pocket % 2 === 0;
      case 'low':
        return pocket <= 18;
      case 'high':
        return pocket >= 19;
    }
  }

  /** Parses 'red' or 'straight:17'; null when malformed. */
  parseBet(option: string): RouletteBet | null {
    const outside = OUTSIDE_BETS.find((kind) => kind === option);
    if (outside) return { kind: outside };
    const match = /^straight:(\d{1,2})$/.exec(option);
    const number = match ? Number(match[1]) : Number.NaN;
    return number >= 0 && number < POCKETS ? { kind: 'straight', number } : null;
  }
}
