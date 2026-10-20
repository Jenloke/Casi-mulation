import type { GameId } from '@casino/contracts';

/** A shop item. Adding an item is one entry in ITEM_DEFINITIONS. */
export interface ItemDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** The one game this item helps with. */
  readonly gameId: GameId;
  readonly price: number;
  /** Odds boost handed to the game each round; at most MAX_ODDS_BOOST. */
  readonly boost: number;
  /** Rounds the item lasts. */
  readonly uses: number;
}

/** Hard cap on any item's odds boost, so items stay a small edge. */
export const MAX_ODDS_BOOST = 0.1;
