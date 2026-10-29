import {
  ANALYTICS_PATH,
  type AnalyticsSnapshotDto,
  GAME_SOCKET_PATH,
  type ServerMessage,
} from '@casino/contracts';
import { CasinoWorld, DomainEventBus, ManualClock, SeededRng } from '@casino/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type CasinoServer, createCasinoServer } from '../src/CasinoServer.ts';
import { ClientHub } from '../src/net/ClientHub.ts';

describe('ClientHub', () => {
  it('welcomes a guest, relays commands, broadcasts state and lets them leave', () => {
    const world = new CasinoWorld({
      rng: new SeededRng(1),
      clock: new ManualClock(),
      events: new DomainEventBus(),
      botCount: 0,
    });
    const hub = new ClientHub(world);
    const sent: ServerMessage[] = [];
    const playerId = hub.connect({ send: (data) => sent.push(JSON.parse(data)) });
    expect(sent[0]).toMatchObject({ type: 'welcome', playerId, games: expect.any(Array) });

    const buy = { type: 'command', command: { type: 'buyItem', itemId: 'lucky-coin' } };
    hub.receive(playerId, JSON.stringify(buy));
    expect(sent.at(-1)).toMatchObject({ type: 'rejected', command: 'buyItem' });

    hub.broadcastState();
    expect(sent.at(-1)).toMatchObject({ type: 'state', self: { playerId, chips: 1000 } });

    hub.disconnect(playerId);
    expect(world.player(playerId)).toBeUndefined();
  });
});

describe('casino server', () => {
  let server: CasinoServer;
  const config = { port: 0, host: 'localhost', seed: 42, botCount: 4, logLevel: 'silent' };

  beforeAll(async () => {
    server = await createCasinoServer(config, new ManualClock(1_000));
    await server.app.ready();
  });

  afterAll(async () => {
    await server.app.close();
  });

  it('reports health', async () => {
    const response = await server.app.inject({ url: '/health' });
    expect(response.json()).toEqual({ ok: true });
  });

  it('serves analytics that reflect bot play', async () => {
    for (let beat = 0; beat < 3_000; beat++) server.loop.step();
    const response = await server.app.inject({ url: ANALYTICS_PATH });
    const snapshot = response.json<AnalyticsSnapshotDto>();
    expect(snapshot.games.map((game) => game.gameId)).toEqual([
      'slots',
      'roulette',
      'blackjack',
      'baccarat',
    ]);
    expect(snapshot.totals.rounds).toBeGreaterThan(0);
    expect(snapshot.population.botsOnline).toBeGreaterThan(0);
    expect(snapshot.leaderboard.length).toBeGreaterThan(0);
    expect(server.events.count()).toBeGreaterThan(snapshot.totals.rounds);
  });

  it('streams state to WebSocket guests', async () => {
    const socket = await server.app.injectWS(GAME_SOCKET_PATH);
    const messages: ServerMessage[] = [];
    socket.on('message', (data) => messages.push(JSON.parse(String(data))));
    server.loop.step();
    await waitFor(() => messages.some((message) => message.type === 'state'));
    socket.terminate();
  });
});

async function waitFor(condition: () => boolean, timeoutMs = 2_000): Promise<void> {
  const deadline = performance.now() + timeoutMs;
  while (!condition()) {
    if (performance.now() > deadline) throw new Error('Timed out waiting');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
