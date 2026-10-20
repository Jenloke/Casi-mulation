import type { BetOptionDto } from '@casino/contracts';
import type { CasinoGame, RoundContext, RoundStep, Wager } from '../CasinoGame.ts';
import { SlotPaytable, type SlotSymbol, SYMBOL_LABELS } from './SlotPaytable.ts';

/** Three-reel slot machine. Item boost: a losing spin may get one free re-spin. */
export class SlotsGame implements CasinoGame<never> {
  readonly id = 'slots';
  readonly name = 'Slots';
  readonly minBet = 1;
  readonly maxBet = 50;
  readonly betOptions: readonly BetOptionDto[] = [
    { id: 'spin', label: 'Spin', payout: '2x to 100x', numberRange: null },
  ];
  private readonly paytable = new SlotPaytable();
  readonly theoreticalRtp = this.paytable.expectedReturn();

  isValidOption(option: string): boolean {
    return option === 'spin';
  }

  startRound(wager: Wager, ctx: RoundContext): RoundStep<never> {
    const notes: string[] = [];
    let line = this.paytable.spin(ctx.rng);
    if (this.paytable.multiplier(line) === 0 && ctx.rng.chance(ctx.boost)) {
      notes.push(`Lucky re-spin after ${this.describe(line)}`);
      line = this.paytable.spin(ctx.rng);
    }
    const multiplier = this.paytable.multiplier(line);
    return {
      status: 'settled',
      payout: wager.amount * multiplier,
      view: {
        headline: this.describe(line),
        details: [...notes, multiplier > 0 ? `Pays ${multiplier}x` : 'No win'],
      },
    };
  }

  private describe(line: readonly SlotSymbol[]): string {
    return line.map((symbol) => SYMBOL_LABELS[symbol]).join(' | ');
  }
}
