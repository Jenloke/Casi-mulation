import type {
  AnalyticsSnapshotDto,
  GameId,
  GameInfoDto,
  ItemDefinitionDto,
  PlayerKind,
  VolumeDto,
  WinRateDto,
} from '@casino/contracts';
import type { DomainEvent } from '@casino/core';
import { RoundsTimeline } from './RoundsTimeline.ts';

type BetPlaced = Extract<DomainEvent, { type: 'BetPlaced' }>;
type PayoutSettled = Extract<DomainEvent, { type: 'PayoutSettled' }>;

interface Volume {
  rounds: number;
  wagered: number;
  paid: number;
}

interface WinTally {
  rounds: number;
  wins: number;
}

/** The part of the analytics snapshot that comes from domain events. */
export type EventAnalytics = Pick<
  AnalyticsSnapshotDto,
  'totals' | 'games' | 'timeline' | 'itemUsage' | 'itemEffect'
> & { readonly byKind: Readonly<Record<PlayerKind, VolumeDto>> };

/**
 * Folds domain events into running totals for the dashboard, O(1) per event. Wagers count
 * when a bet is placed and payouts when it settles, so RTP = paid / wagered.
 */
export class AnalyticsAggregator {
  private readonly byGame = new Map<GameId, Volume>();
  private readonly byKind: Record<PlayerKind, Volume> = { human: volume(), bot: volume() };
  private readonly withItem = new Map<GameId, WinTally>();
  private readonly withoutItem = new Map<GameId, WinTally>();
  private readonly uses = new Map<string, number>();
  private readonly purchases = new Map<string, number>();
  private readonly timeline: RoundsTimeline;

  constructor(timeline = new RoundsTimeline(10_000, 60)) {
    this.timeline = timeline;
  }

  apply(event: DomainEvent): void {
    if (event.type === 'BetPlaced') this.onBet(event);
    else if (event.type === 'PayoutSettled') this.onPayout(event);
    else if (event.type === 'ItemUsed') increment(this.uses, event.itemId);
    else if (event.type === 'ItemPurchased') increment(this.purchases, event.itemId);
  }

  snapshot(
    now: number,
    games: readonly GameInfoDto[],
    items: readonly ItemDefinitionDto[],
  ): EventAnalytics {
    const gameStats = games.map((game) => {
      const stats = this.byGame.get(game.id) ?? volume();
      return {
        gameId: game.id,
        name: game.name,
        ...stats,
        actualRtp: ratio(stats.paid, stats.wagered),
        theoreticalRtp: game.theoreticalRtp,
      };
    });
    const totals = volume();
    for (const stats of gameStats) {
      totals.rounds += stats.rounds;
      totals.wagered += stats.wagered;
      totals.paid += stats.paid;
    }
    return {
      totals: { ...totals, actualRtp: ratio(totals.paid, totals.wagered) },
      games: gameStats,
      timeline: { bucketMs: this.timeline.bucketMs, buckets: this.timeline.window(now) },
      byKind: { human: { ...this.byKind.human }, bot: { ...this.byKind.bot } },
      itemUsage: items.map((item) => ({
        itemId: item.id,
        name: item.name,
        gameId: item.gameId,
        purchases: this.purchases.get(item.id) ?? 0,
        uses: this.uses.get(item.id) ?? 0,
      })),
      itemEffect: games.map((game) => ({
        gameId: game.id,
        withItem: winRate(this.withItem.get(game.id)),
        withoutItem: winRate(this.withoutItem.get(game.id)),
      })),
    };
  }

  private onBet(event: BetPlaced): void {
    this.volumeFor(event.gameId).wagered += event.amount;
    this.byKind[event.playerKind].wagered += event.amount;
  }

  private onPayout(event: PayoutSettled): void {
    for (const stats of [this.volumeFor(event.gameId), this.byKind[event.playerKind]]) {
      stats.rounds++;
      stats.paid += event.payout;
    }
    const tallies = event.itemId === null ? this.withoutItem : this.withItem;
    const tally = tallies.get(event.gameId) ?? { rounds: 0, wins: 0 };
    tally.rounds++;
    if (event.outcome === 'win') tally.wins++;
    tallies.set(event.gameId, tally);
    this.timeline.add(event.at, event.gameId);
  }

  private volumeFor(gameId: GameId): Volume {
    const stats = this.byGame.get(gameId) ?? volume();
    this.byGame.set(gameId, stats);
    return stats;
  }
}

function volume(): Volume {
  return { rounds: 0, wagered: 0, paid: 0 };
}

function increment(counts: Map<string, number>, key: string): void {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function ratio(part: number, whole: number): number | null {
  return whole > 0 ? part / whole : null;
}

function winRate(tally: WinTally | undefined): WinRateDto {
  const rounds = tally?.rounds ?? 0;
  const wins = tally?.wins ?? 0;
  return { rounds, wins, winRate: ratio(wins, rounds) };
}
