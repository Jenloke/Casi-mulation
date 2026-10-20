import type { GameId, RoundOutcome } from '@casino/contracts';
import type { RoundView } from '../games/CasinoGame.ts';

/** What every round carries from bet to payout. */
export interface RoundTicket {
  readonly roundId: string;
  readonly gameId: GameId;
  readonly wager: number;
  readonly itemId: string | null;
  readonly boost: number;
}

/** A round waiting for the player's decision. */
export interface PendingRound extends RoundTicket {
  readonly state: unknown;
  readonly actions: readonly string[];
  readonly view: RoundView;
}

export interface SettledRound extends RoundTicket {
  readonly payout: number;
  readonly outcome: RoundOutcome;
  readonly view: RoundView;
}
