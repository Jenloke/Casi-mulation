import type { GameId, PlayerId, PlayerKind } from './ids.ts';

/** HTTP path of the live analytics snapshot. */
export const ANALYTICS_PATH = '/api/analytics';

export interface VolumeDto {
  readonly rounds: number;
  readonly wagered: number;
  readonly paid: number;
}

export interface GameStatsDto extends VolumeDto {
  readonly gameId: GameId;
  readonly name: string;
  /** paid / wagered; null until something was wagered. */
  readonly actualRtp: number | null;
  /**
   * What the bets placed should return: each bet option's theoretical RTP weighted by the
   * chips wagered on it. The game's headline figure until something is wagered.
   */
  readonly theoreticalRtp: number;
}

export interface TimelineBucketDto {
  /** Bucket start, epoch ms. */
  readonly start: number;
  readonly roundsByGame: Readonly<Record<GameId, number>>;
}

export interface PopulationDto {
  readonly humansOnline: number;
  readonly botsOnline: number;
  readonly byKind: Readonly<Record<PlayerKind, VolumeDto>>;
}

export interface WinRateDto {
  readonly rounds: number;
  readonly wins: number;
  /** wins / rounds; null until a round was played. */
  readonly winRate: number | null;
}

export interface ItemEffectDto {
  readonly gameId: GameId;
  readonly withItem: WinRateDto;
  readonly withoutItem: WinRateDto;
}

export interface ItemUsageDto {
  readonly itemId: string;
  readonly name: string;
  readonly gameId: GameId;
  readonly purchases: number;
  readonly uses: number;
}

export interface LeaderboardEntryDto {
  readonly playerId: PlayerId;
  readonly name: string;
  readonly kind: PlayerKind;
  readonly chips: number;
}

export interface AnalyticsSnapshotDto {
  readonly generatedAt: number;
  readonly totals: VolumeDto & { readonly actualRtp: number | null };
  readonly games: readonly GameStatsDto[];
  readonly timeline: {
    readonly bucketMs: number;
    readonly buckets: readonly TimelineBucketDto[];
  };
  readonly population: PopulationDto;
  readonly itemUsage: readonly ItemUsageDto[];
  readonly itemEffect: readonly ItemEffectDto[];
  readonly leaderboard: readonly LeaderboardEntryDto[];
}
