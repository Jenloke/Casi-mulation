import type { GameId } from '@casino/contracts';
import { describe, expect, it } from 'vitest';
import type { DomainEvent } from '../src/events/DomainEvent.ts';
import { DomainEventBus } from '../src/events/DomainEventBus.ts';
import type { Player } from '../src/players/Player.ts';
import { SeededRng } from '../src/random/SeededRng.ts';
import { ManualClock } from '../src/time/Clock.ts';
import { CasinoWorld } from '../src/world/CasinoWorld.ts';

function createWorld(botCount = 0) {
  const bus = new DomainEventBus();
  const events: DomainEvent[] = [];
  bus.subscribe((event) => events.push(event));
  const world = new CasinoWorld({
    rng: new SeededRng(7),
    clock: new ManualClock(1_000),
    events: bus,
    botCount,
  });
  return { world, events };
}

function ofType<T extends DomainEvent['type']>(events: readonly DomainEvent[], type: T) {
  return events.filter((event): event is Extract<DomainEvent, { type: T }> => event.type === type);
}

/** Advances until the condition holds; returns whether it did within `maxTicks`. */
function runUntil(world: CasinoWorld, condition: () => boolean, maxTicks = 2_000): boolean {
  for (let tick = 0; tick < maxTicks && !condition(); tick++) world.advance();
  return condition();
}

function seatAt(world: CasinoWorld, guest: Player, gameId: GameId): void {
  const tile = world.floor.tables.find((table) => table.gameId === gameId)?.tiles[0];
  if (!tile) throw new Error(`No ${gameId} table`);
  expect(world.execute(guest.id, { type: 'moveTo', target: tile })).toEqual({ ok: true });
  expect(runUntil(world, () => guest.seated)).toBe(true);
}

describe('CasinoWorld', () => {
  it('lets a guest walk in, step around and bump into walls', () => {
    const { world } = createWorld();
    const guest = world.join();
    const start = guest.pos;
    expect(world.floor.isEntrance(start)).toBe(true);
    expect(world.execute(guest.id, { type: 'step', direction: 'up' })).toEqual({ ok: true });
    runUntil(world, () => !guest.isMoving);
    expect(guest.pos).toEqual({ x: start.x, y: start.y - 1 });
    world.execute(guest.id, { type: 'step', direction: 'down' });
    runUntil(world, () => !guest.isMoving);
    expect(world.execute(guest.id, { type: 'step', direction: 'down' }).ok).toBe(false);
  });

  it('walks to a free seat when a table is clicked, then plays roulette', () => {
    const { world, events } = createWorld();
    const guest = world.join();
    expect(world.execute(guest.id, { type: 'placeBet', amount: 10, option: 'red' })).toEqual({
      ok: false,
      reason: 'Sit down at a table first',
    });
    seatAt(world, guest, 'roulette');
    const chipsBefore = guest.chips;
    expect(world.execute(guest.id, { type: 'placeBet', amount: 10, option: 'red' })).toEqual({
      ok: true,
    });
    const [payout] = ofType(events, 'PayoutSettled');
    expect(ofType(events, 'BetPlaced')).toEqual([
      expect.objectContaining({ playerId: guest.id, gameId: 'roulette', amount: 10 }),
    ]);
    expect(guest.chips).toBe(chipsBefore - 10 + (payout?.payout ?? Number.NaN));
  });

  it('waits for blackjack decisions and keeps the player at the table until the hand ends', () => {
    const { world, events } = createWorld();
    const guest = world.join();
    seatAt(world, guest, 'blackjack');
    world.execute(guest.id, { type: 'placeBet', amount: 20, option: 'hand' });
    if (guest.pendingRound) {
      expect(world.execute(guest.id, { type: 'step', direction: 'up' }).ok).toBe(false);
      expect(world.execute(guest.id, { type: 'roundAction', action: 'stand' })).toEqual({
        ok: true,
      });
    }
    expect(guest.pendingRound).toBeNull();
    expect(guest.lastRound?.gameId).toBe('blackjack');
    expect(ofType(events, 'PayoutSettled')).toHaveLength(1);
  });

  it('sells items at the counter and spends a use per round of their game', () => {
    const { world, events } = createWorld();
    const guest = world.join();
    const counterIndex = world.floor.tiles.indexOf('counter');
    const counter = {
      x: counterIndex % world.floor.width,
      y: Math.floor(counterIndex / world.floor.width),
    };
    expect(world.execute(guest.id, { type: 'moveTo', target: counter })).toEqual({ ok: true });
    runUntil(world, () => !guest.isMoving);
    expect(world.floor.isShop(guest.pos)).toBe(true);
    expect(world.execute(guest.id, { type: 'buyItem', itemId: 'four-leaf-clover' })).toEqual({
      ok: true,
    });
    expect(guest.inventory.items()).toEqual([
      expect.objectContaining({ itemId: 'four-leaf-clover', usesLeft: 8 }),
    ]);

    seatAt(world, guest, 'roulette');
    world.execute(guest.id, { type: 'placeBet', amount: 10, option: 'black' });
    expect(ofType(events, 'ItemUsed')).toEqual([
      expect.objectContaining({ itemId: 'four-leaf-clover', boost: 0.06, usesLeft: 7 }),
    ]);
    expect(ofType(events, 'BetPlaced')[0]?.itemId).toBe('four-leaf-clover');
  });

  it('hands a guest on auto-play to the shared bot brain', () => {
    const { world, events } = createWorld();
    const guest = world.join();
    expect(world.execute(guest.id, { type: 'setAutoPlay', enabled: true })).toEqual({ ok: true });
    expect(world.execute(guest.id, { type: 'step', direction: 'up' })).toEqual({
      ok: false,
      reason: 'Auto-play is on',
    });
    const played = () => ofType(events, 'PayoutSettled').some((e) => e.playerId === guest.id);
    expect(runUntil(world, played, 5_000)).toBe(true);
  });

  it('speeds the shared clock up only while a guest auto-plays', () => {
    const { world } = createWorld();
    const guest = world.join();
    world.execute(guest.id, { type: 'setSimSpeed', speed: 4 });
    expect(world.simSpeed).toBe(1);
    world.execute(guest.id, { type: 'setAutoPlay', enabled: true });
    expect(world.simSpeed).toBe(4);
    world.execute(guest.id, { type: 'setAutoPlay', enabled: false });
    expect(world.simSpeed).toBe(1);
  });

  it('keeps the floor busy with bots that play every game', () => {
    const { world, events } = createWorld(8);
    runUntil(world, () => false, 6_000);
    const bots = world.allPlayers().filter((player) => player.kind === 'bot');
    expect(bots.length).toBeGreaterThanOrEqual(6);
    expect(bots.length).toBeLessThanOrEqual(8);
    const botGames = ofType(events, 'PayoutSettled')
      .filter((event) => event.playerKind === 'bot')
      .map((event) => event.gameId);
    expect([...new Set(botGames)].sort()).toEqual(['baccarat', 'blackjack', 'roulette', 'slots']);
  });

  it('snapshots the floor, players and private state for clients', () => {
    const { world } = createWorld(2);
    const guest = world.join();
    runUntil(world, () => false, 20);
    expect(world.floorDto().tables).toHaveLength(14);
    expect(world.snapshot().players.map((player) => player.id)).toContain(guest.id);
    expect(world.selfState(guest.id)).toMatchObject({ playerId: guest.id, chips: 1000 });
  });
});
