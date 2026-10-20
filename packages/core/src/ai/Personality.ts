import type { GameId } from '@casino/contracts';
import type { CharacterAppearance } from '../players/CharacterProfile.ts';

/** Tunables that make bots differ. Every bot, and auto-play, runs the same BotBrain. */
export interface Personality {
  readonly id: string;
  readonly label: string;
  /** Relative appetite per game; unlisted games get weight 1. */
  readonly gameWeights: Readonly<Record<GameId, number>>;
  /** Share of current chips staked per round, clamped to table limits. */
  readonly betFraction: number;
  readonly roundsPerVisit: readonly [min: number, max: number];
  /** Pause between decisions, in ticks. */
  readonly thinkTicks: readonly [min: number, max: number];
  /** Chance that the next errand is a shop visit. */
  readonly shopChance: number;
  /** Chance that the next errand is a stroll. */
  readonly strollChance: number;
  readonly startingChips: number;
  readonly appearance: CharacterAppearance;
}
