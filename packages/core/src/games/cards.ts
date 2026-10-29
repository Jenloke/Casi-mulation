import type { Rng } from '../random/Rng.ts';

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export const SUITS = ['♠', '♥', '♦', '♣'] as const;
export type Rank = (typeof RANKS)[number];
export type Suit = (typeof SUITS)[number];

export interface Card {
  readonly rank: Rank;
  readonly suit: Suit;
}

/** An endless shoe: every draw is independent, which keeps the odds easy to reason about. */
export class InfiniteShoe {
  draw(rng: Rng): Card {
    return { rank: rng.pick(RANKS), suit: rng.pick(SUITS) };
  }
}

export function formatCards(cards: readonly Card[]): string {
  return cards.map((card) => `${card.rank}${card.suit}`).join(' ');
}
