import type { AnalyticsSnapshotDto, LeaderboardEntryDto } from '@casino/contracts';
import type { CasinoWorld, Clock, Player } from '@casino/core';
import type { AnalyticsAggregator } from './AnalyticsAggregator.ts';

const LEADERBOARD_SIZE = 10;

export interface AnalyticsServiceDeps {
  readonly aggregator: AnalyticsAggregator;
  readonly world: CasinoWorld;
  readonly clock: Clock;
}

/** Builds the dashboard snapshot: event aggregates plus who is on the floor right now. */
export class AnalyticsService {
  private readonly deps: AnalyticsServiceDeps;

  constructor(deps: AnalyticsServiceDeps) {
    this.deps = deps;
  }

  snapshot(): AnalyticsSnapshotDto {
    const { aggregator, world, clock } = this.deps;
    const now = clock.now();
    const players = world.allPlayers();
    const { byKind, ...fromEvents } = aggregator.snapshot(
      now,
      world.gameInfos(),
      world.itemInfos(),
    );
    return {
      generatedAt: now,
      ...fromEvents,
      population: {
        humansOnline: players.filter((player) => player.kind === 'human').length,
        botsOnline: players.filter((player) => player.kind === 'bot').length,
        byKind,
      },
      leaderboard: this.leaderboard(players),
    };
  }

  private leaderboard(players: readonly Player[]): LeaderboardEntryDto[] {
    return [...players]
      .sort((a, b) => b.chips - a.chips)
      .slice(0, LEADERBOARD_SIZE)
      .map((player) => ({
        playerId: player.id,
        name: player.name,
        kind: player.kind,
        chips: player.chips,
      }));
  }
}
