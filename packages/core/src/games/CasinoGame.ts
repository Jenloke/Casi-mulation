import type { BetOptionDto, GameId } from '@casino/contracts';
import type { Rng } from '../random/Rng.ts';

export interface Wager {
  readonly amount: number;
  /** One of the game's bet option ids, or `${id}:${n}` for numbered options. */
  readonly option: string;
}

export interface RoundContext {
  readonly rng: Rng;
  /** Capped odds boost from the player's active item, 0 without one. Each game decides how it helps. */
  readonly boost: number;
}

/** Player-facing description of a round. Plain text, so a new game needs no UI work. */
export interface RoundView {
  readonly headline: string;
  readonly details: readonly string[];
}

/** `payout` is everything handed back to the player, stake included (0 on a loss). */
export type RoundStep<TState> =
  | { readonly status: 'settled'; readonly payout: number; readonly view: RoundView }
  | {
      readonly status: 'pending';
      readonly state: TState;
      readonly actions: readonly string[];
      readonly view: RoundView;
    };

/**
 * A game played against the house. To add one, implement this interface and add a
 * line to createDefaultGameRegistry().
 */
export interface CasinoGame<TState = unknown> {
  readonly id: GameId;
  readonly name: string;
  readonly minBet: number;
  readonly maxBet: number;
  /** Long-run payout / wager without items; shown next to the actual RTP on the dashboard. */
  readonly theoreticalRtp: number;
  readonly betOptions: readonly BetOptionDto[];
  isValidOption(option: string): boolean;
  /** Takes the wager and either settles the round or asks the player for a decision. */
  startRound(wager: Wager, ctx: RoundContext): RoundStep<TState>;
  /** Games with decisions (blackjack) continue a pending round here. */
  applyAction?(state: TState, action: string, ctx: RoundContext): RoundStep<TState>;
  /** The decision the shared AI brain makes for a pending round. */
  suggestAction?(state: TState): string;
}
