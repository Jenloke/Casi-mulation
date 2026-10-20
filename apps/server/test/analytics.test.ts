import type { GameInfoDto, ItemDefinitionDto } from '@casino/contracts';
import { describe, expect, it } from 'vitest';
import { AnalyticsAggregator } from '../src/analytics/AnalyticsAggregator.ts';
import { RoundsTimeline } from '../src/analytics/RoundsTimeline.ts';

const games: GameInfoDto[] = [
  { id: 'slots', name: 'Slots', minBet: 1, maxBet: 50, theoreticalRtp: 0.96, betOptions: [] },
];
const items: ItemDefinitionDto[] = [
  {
    id: 'lucky-coin',
    name: 'Lucky Coin',
    description: '',
    gameId: 'slots',
    price: 40,
    boost: 0.05,
    uses: 10,
  },
];

describe('AnalyticsAggregator', () => {
  it('totals wagers, payouts, item use and win rates', () => {
    const aggregator = new AnalyticsAggregator(new RoundsTimeline(10_000, 6));
    const bot = { playerId: 'bot-1', playerKind: 'bot' as const, at: 1_000, gameId: 'slots' };
    const guest = { playerId: 'guest-1', playerKind: 'human' as const, at: 2_000, gameId: 'slots' };
    aggregator.apply({
      ...bot,
      type: 'BetPlaced',
      roundId: 'r1',
      amount: 10,
      option: 'spin',
      itemId: null,
    });
    aggregator.apply({
      ...bot,
      type: 'PayoutSettled',
      roundId: 'r1',
      wager: 10,
      payout: 20,
      outcome: 'win',
      itemId: null,
    });
    aggregator.apply({ ...guest, type: 'ItemPurchased', itemId: 'lucky-coin', price: 40 });
    aggregator.apply({
      ...guest,
      type: 'BetPlaced',
      roundId: 'r2',
      amount: 30,
      option: 'spin',
      itemId: 'lucky-coin',
    });
    aggregator.apply({
      ...guest,
      type: 'ItemUsed',
      roundId: 'r2',
      itemId: 'lucky-coin',
      boost: 0.05,
      usesLeft: 9,
    });
    aggregator.apply({
      ...guest,
      type: 'PayoutSettled',
      roundId: 'r2',
      wager: 30,
      payout: 0,
      outcome: 'loss',
      itemId: 'lucky-coin',
    });

    const snapshot = aggregator.snapshot(5_000, games, items);
    expect(snapshot.games[0]).toMatchObject({ rounds: 2, wagered: 40, paid: 20, actualRtp: 0.5 });
    expect(snapshot.totals).toEqual({ rounds: 2, wagered: 40, paid: 20, actualRtp: 0.5 });
    expect(snapshot.byKind.bot).toEqual({ rounds: 1, wagered: 10, paid: 20 });
    expect(snapshot.itemUsage).toEqual([
      expect.objectContaining({ itemId: 'lucky-coin', purchases: 1, uses: 1 }),
    ]);
    expect(snapshot.itemEffect).toEqual([
      {
        gameId: 'slots',
        withItem: { rounds: 1, wins: 0, winRate: 0 },
        withoutItem: { rounds: 1, wins: 1, winRate: 1 },
      },
    ]);
    expect(snapshot.timeline.buckets.at(-1)?.roundsByGame).toEqual({ slots: 2 });
  });
});

describe('RoundsTimeline', () => {
  it('buckets rounds over time and forgets old buckets', () => {
    const timeline = new RoundsTimeline(10_000, 3);
    timeline.add(1_000, 'slots');
    timeline.add(25_000, 'slots');
    timeline.add(26_000, 'roulette');
    const window = timeline.window(29_000);
    expect(window.map((bucket) => bucket.start)).toEqual([0, 10_000, 20_000]);
    expect(window.map((bucket) => bucket.roundsByGame)).toEqual([
      { slots: 1 },
      {},
      { slots: 1, roulette: 1 },
    ]);
    timeline.add(45_000, 'slots');
    expect(timeline.window(45_000).map((bucket) => bucket.roundsByGame)).toEqual([
      { slots: 1, roulette: 1 },
      {},
      { slots: 1 },
    ]);
  });
});
