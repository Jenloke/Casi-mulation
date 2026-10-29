import type { BetOptionDto } from '@casino/contracts';
import type { CasinoGame, RoundContext, RoundStep, Wager } from '../CasinoGame.ts';
import { POCKETS, type RouletteBet, RouletteWheel } from './RouletteWheel.ts';

/** Single-zero roulette. Item boost: a losing spin may be spun again once. */
export class RouletteGame implements CasinoGame<never> {
  readonly id = 'roulette';
  readonly name = 'Roulette';
  readonly minBet = 5;
  readonly maxBet = 200;
  readonly theoreticalRtp = 36 / POCKETS;
  /** Every bet returns 36/37: the zero is the whole house edge. */
  readonly betOptions: readonly BetOptionDto[] = [
    { id: 'red', label: 'Red', payout: '1:1', numberRange: null },
    { id: 'black', label: 'Black', payout: '1:1', numberRange: null },
    { id: 'odd', label: 'Odd', payout: '1:1', numberRange: null },
    { id: 'even', label: 'Even', payout: '1:1', numberRange: null },
    { id: 'low', label: '1-18', payout: '1:1', numberRange: null },
    { id: 'high', label: '19-36', payout: '1:1', numberRange: null },
    {
      id: 'straight',
      label: 'Single number',
      payout: '35:1',
      numberRange: { min: 0, max: POCKETS - 1 },
    },
  ].map((option) => ({ ...option, theoreticalRtp: this.theoreticalRtp }));
  private readonly wheel = new RouletteWheel();

  isValidOption(option: string): boolean {
    return this.wheel.parseBet(option) !== null;
  }

  startRound(wager: Wager, ctx: RoundContext): RoundStep<never> {
    const bet = this.wheel.parseBet(wager.option);
    if (!bet) throw new Error(`Invalid roulette bet '${wager.option}'`);
    const notes: string[] = [];
    let pocket = this.wheel.spin(ctx.rng);
    if (!this.wheel.wins(bet, pocket) && ctx.rng.chance(ctx.boost)) {
      notes.push(`Lucky re-spin after ${this.describe(pocket)}`);
      pocket = this.wheel.spin(ctx.rng);
    }
    const won = this.wheel.wins(bet, pocket);
    const payout = won ? wager.amount * this.wheel.multiplier(bet) : 0;
    return {
      status: 'settled',
      payout,
      view: {
        headline: this.describe(pocket),
        details: [
          ...notes,
          `Bet on ${this.describeBet(bet)}`,
          won ? `Win! Pays ${payout}` : 'House wins',
        ],
      },
    };
  }

  private describe(pocket: number): string {
    return `${pocket} ${this.wheel.color(pocket)}`;
  }

  private describeBet(bet: RouletteBet): string {
    return bet.kind === 'straight' ? `number ${bet.number}` : bet.kind;
  }
}
