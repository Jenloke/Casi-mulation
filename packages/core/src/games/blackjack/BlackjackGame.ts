import type { BetOptionDto } from '@casino/contracts';
import type { Rng } from '../../random/Rng.ts';
import type { CasinoGame, RoundContext, RoundStep, Wager } from '../CasinoGame.ts';
import { BasicStrategy } from './BasicStrategy.ts';
import { type Card, formatCards, InfiniteShoe } from './cards.ts';
import { handValue, isBlackjack } from './hand.ts';

export interface BlackjackState {
  readonly wager: number;
  readonly player: readonly Card[];
  /** dealer[0] is face up, dealer[1] is the hole card. */
  readonly dealer: readonly Card[];
  readonly notes: readonly string[];
}

const DEALER_STANDS_ON = 17;
const ACTIONS = ['hit', 'stand'] as const;

/**
 * Blackjack against the dealer: infinite shoe, dealer stands on soft 17, blackjack pays 3:2,
 * no doubling or splitting. Item boost: a hit that would bust may be redrawn once.
 */
export class BlackjackGame implements CasinoGame<BlackjackState> {
  readonly id = 'blackjack';
  readonly name = 'Blackjack';
  readonly minBet = 10;
  readonly maxBet = 250;
  /** BasicStrategy's return, measured over 10M simulated rounds (see docs/decisions.md). */
  readonly theoreticalRtp = 0.9758;
  readonly betOptions: readonly BetOptionDto[] = [
    { id: 'hand', label: 'Deal', payout: '1:1, blackjack 3:2', numberRange: null },
  ];
  private readonly shoe = new InfiniteShoe();
  private readonly strategy = new BasicStrategy();

  isValidOption(option: string): boolean {
    return option === 'hand';
  }

  startRound(wager: Wager, ctx: RoundContext): RoundStep<BlackjackState> {
    const draw = (): Card => this.shoe.draw(ctx.rng);
    const state: BlackjackState = {
      wager: wager.amount,
      player: [draw(), draw()],
      dealer: [draw(), draw()],
      notes: [],
    };
    if (isBlackjack(state.player) || isBlackjack(state.dealer)) return this.settle(state);
    return this.pending(state);
  }

  applyAction(state: BlackjackState, action: string, ctx: RoundContext): RoundStep<BlackjackState> {
    if (action === 'stand') return this.settle(this.dealerPlays(state, ctx.rng));
    if (action !== 'hit') throw new Error(`Unknown blackjack action '${action}'`);
    const next = this.hit(state, ctx);
    const { total } = handValue(next.player);
    if (total > 21) return this.settle(next);
    if (total === 21) return this.settle(this.dealerPlays(next, ctx.rng));
    return this.pending(next);
  }

  suggestAction(state: BlackjackState): string {
    const upcard = state.dealer[0];
    return upcard ? this.strategy.decide(state.player, upcard) : 'stand';
  }

  private hit(state: BlackjackState, ctx: RoundContext): BlackjackState {
    let card = this.shoe.draw(ctx.rng);
    const notes = [...state.notes];
    if (handValue([...state.player, card]).total > 21 && ctx.rng.chance(ctx.boost)) {
      notes.push(`Lucky redraw: ${formatCards([card])} would have busted you`);
      card = this.shoe.draw(ctx.rng);
    }
    return { ...state, player: [...state.player, card], notes };
  }

  private dealerPlays(state: BlackjackState, rng: Rng): BlackjackState {
    const dealer = [...state.dealer];
    while (handValue(dealer).total < DEALER_STANDS_ON) dealer.push(this.shoe.draw(rng));
    return { ...state, dealer };
  }

  private settle(state: BlackjackState): RoundStep<BlackjackState> {
    const { payout, result } = this.resolve(state);
    return {
      status: 'settled',
      payout,
      view: {
        headline: result,
        details: [
          this.describeHand('You', state.player),
          this.describeHand('Dealer', state.dealer),
          ...state.notes,
        ],
      },
    };
  }

  private resolve(state: BlackjackState): { payout: number; result: string } {
    const { wager } = state;
    const player = handValue(state.player).total;
    const dealer = handValue(state.dealer).total;
    const playerBlackjack = isBlackjack(state.player);
    const dealerBlackjack = isBlackjack(state.dealer);
    if (playerBlackjack && dealerBlackjack)
      return { payout: wager, result: 'Both blackjack: push' };
    if (playerBlackjack) return { payout: wager + Math.floor(wager * 1.5), result: 'Blackjack!' };
    if (dealerBlackjack) return { payout: 0, result: 'Dealer has blackjack' };
    if (player > 21) return { payout: 0, result: 'Bust' };
    if (dealer > 21) return { payout: wager * 2, result: 'Dealer busts, you win' };
    if (player > dealer) return { payout: wager * 2, result: 'You win' };
    if (player === dealer) return { payout: wager, result: 'Push' };
    return { payout: 0, result: 'Dealer wins' };
  }

  private pending(state: BlackjackState): RoundStep<BlackjackState> {
    const { total, soft } = handValue(state.player);
    return {
      status: 'pending',
      state,
      actions: ACTIONS,
      view: {
        headline: `You have ${soft ? 'soft ' : ''}${total}`,
        details: [
          this.describeHand('You', state.player),
          `Dealer shows ${formatCards(state.dealer.slice(0, 1))}`,
          ...state.notes,
        ],
      },
    };
  }

  private describeHand(who: string, cards: readonly Card[]): string {
    return `${who}: ${formatCards(cards)} (${handValue(cards).total})`;
  }
}
