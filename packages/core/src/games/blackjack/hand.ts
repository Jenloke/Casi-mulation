import type { Card } from '../cards.ts';

export interface HandValue {
  readonly total: number;
  /** True when an ace is counted as 11. */
  readonly soft: boolean;
}

/** Points of a card, aces counted as 1. */
export function cardPoints(card: Card): number {
  if (card.rank === 'A') return 1;
  if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return 10;
  return Number(card.rank);
}

/** Best total for a hand: one ace counts as 11 when that doesn't bust. */
export function handValue(cards: readonly Card[]): HandValue {
  const hard = cards.reduce((sum, card) => sum + cardPoints(card), 0);
  const hasAce = cards.some((card) => card.rank === 'A');
  return hasAce && hard + 10 <= 21
    ? { total: hard + 10, soft: true }
    : { total: hard, soft: false };
}

export function isBlackjack(cards: readonly Card[]): boolean {
  return cards.length === 2 && handValue(cards).total === 21;
}
