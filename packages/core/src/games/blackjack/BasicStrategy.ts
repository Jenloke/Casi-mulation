import type { Card } from './cards.ts';
import { cardPoints, handValue } from './hand.ts';

export type BlackjackAction = 'hit' | 'stand';

/** Hit/stand basic strategy for an infinite shoe where the dealer stands on soft 17. */
export class BasicStrategy {
  decide(hand: readonly Card[], dealerUpcard: Card): BlackjackAction {
    const { total, soft } = handValue(hand);
    const upcard = dealerUpcard.rank === 'A' ? 11 : cardPoints(dealerUpcard);
    if (soft) return this.softDecision(total, upcard);
    if (total >= 17) return 'stand';
    if (total <= 11) return 'hit';
    if (total === 12) return upcard >= 4 && upcard <= 6 ? 'stand' : 'hit';
    return upcard <= 6 ? 'stand' : 'hit';
  }

  private softDecision(total: number, upcard: number): BlackjackAction {
    if (total >= 19) return 'stand';
    if (total === 18) return upcard >= 9 ? 'hit' : 'stand';
    return 'hit';
  }
}
