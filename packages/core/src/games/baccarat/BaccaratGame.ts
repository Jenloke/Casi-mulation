import type { BetOptionDto } from '@casino/contracts';
import type { Rng } from '../../random/Rng.ts';
import type { CasinoGame, RoundContext, RoundStep, Wager } from '../CasinoGame.ts';
import { type Card, formatCards, InfiniteShoe } from '../cards.ts';
import { type BaccaratBet, BaccaratPaytable } from './BaccaratPaytable.ts';
import { type Coup, type CoupWinner, coupWinner, dealCoup, handTotal, isNatural } from './coup.ts';

const LABELS: Readonly<Record<CoupWinner, string>> = {
  player: 'Player',
  banker: 'Banker',
  tie: 'Tie',
};

/**
 * Punto banco: bet on the player hand, the banker hand or a tie, then the tableau deals
 * the coup with no decisions. Infinite shoe; banker wins pay 0.95:1 (5% commission, rounded
 * up to a whole chip) and a tie pays 8:1. Item boost: a losing coup may be dealt again once.
 */
export class BaccaratGame implements CasinoGame<never> {
  readonly id = 'baccarat';
  readonly name = 'Baccarat';
  /** The smallest stake whose 5% commission is a whole chip. */
  readonly minBet = 20;
  readonly maxBet = 500;
  private readonly paytable = new BaccaratPaytable();
  private readonly shoe = new InfiniteShoe();
  readonly betOptions: readonly BetOptionDto[] = [
    this.betOption('player', '1:1'),
    this.betOption('banker', '0.95:1'),
    this.betOption('tie', '8:1'),
  ];
  /** The banker bet's, the best on the table; the tie returns far less. */
  readonly theoreticalRtp = Math.max(...this.betOptions.map((option) => option.theoreticalRtp));

  isValidOption(option: string): boolean {
    return this.paytable.parseBet(option) !== null;
  }

  startRound(wager: Wager, ctx: RoundContext): RoundStep<never> {
    const bet = this.paytable.parseBet(wager.option);
    if (!bet) throw new Error(`Invalid baccarat bet '${wager.option}'`);
    const notes: string[] = [];
    let coup = this.deal(ctx.rng);
    if (this.payoutFor(bet, coup, wager) === 0 && ctx.rng.chance(ctx.boost)) {
      notes.push(`Lucky re-deal after ${this.score(coup)}`);
      coup = this.deal(ctx.rng);
    }
    const payout = this.payoutFor(bet, coup, wager);
    return {
      status: 'settled',
      payout,
      view: {
        headline: this.headline(coup),
        details: [
          this.describeHand('Player', coup.player),
          this.describeHand('Banker', coup.banker),
          ...notes,
          `Bet on ${LABELS[bet]}`,
          this.describeResult(payout, wager.amount),
        ],
      },
    };
  }

  private betOption(bet: BaccaratBet, payout: string): BetOptionDto {
    const theoreticalRtp = this.paytable.expectedReturn(bet, this.minBet);
    return { id: bet, label: LABELS[bet], payout, theoreticalRtp, numberRange: null };
  }

  private deal(rng: Rng): Coup {
    return dealCoup(() => this.shoe.draw(rng));
  }

  private payoutFor(bet: BaccaratBet, coup: Coup, wager: Wager): number {
    return this.paytable.payout(bet, coupWinner(coup), wager.amount);
  }

  private headline(coup: Coup): string {
    const player = handTotal(coup.player);
    const banker = handTotal(coup.banker);
    const natural = isNatural(coup.player) || isNatural(coup.banker) ? ', a natural' : '';
    if (player === banker) return `Tie at ${player}${natural}`;
    const [high, low] = player > banker ? [player, banker] : [banker, player];
    return `${LABELS[coupWinner(coup)]} wins ${high} to ${low}${natural}`;
  }

  private score(coup: Coup): string {
    return `Player ${handTotal(coup.player)}, Banker ${handTotal(coup.banker)}`;
  }

  private describeHand(who: string, cards: readonly Card[]): string {
    return `${who}: ${formatCards(cards)} (${handTotal(cards)})`;
  }

  private describeResult(payout: number, wager: number): string {
    if (payout > wager) return `Win! Pays ${payout}`;
    if (payout === wager) return 'Tie: your stake comes back';
    return 'House wins';
  }
}
