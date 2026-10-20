import {
  CasinoWorld,
  type Clock,
  DomainEventBus,
  type DomainEventStore,
  InMemoryDomainEventStore,
  SeededRng,
} from '@casino/core';
import type { FastifyInstance } from 'fastify';
import { AnalyticsAggregator } from './analytics/AnalyticsAggregator.ts';
import { AnalyticsService } from './analytics/AnalyticsService.ts';
import type { ServerConfig } from './config.ts';
import { GameLoop } from './GameLoop.ts';
import { buildHttpApp } from './http/buildHttpApp.ts';
import { ClientHub } from './net/ClientHub.ts';

export interface CasinoServer {
  readonly app: FastifyInstance;
  readonly world: CasinoWorld;
  readonly loop: GameLoop;
  readonly events: DomainEventStore;
}

/** Composition root: wires the world, the event log, analytics and the HTTP/WebSocket app. */
export async function createCasinoServer(
  config: ServerConfig,
  clock: Clock,
): Promise<CasinoServer> {
  const bus = new DomainEventBus();
  const events = new InMemoryDomainEventStore();
  const aggregator = new AnalyticsAggregator();
  bus.subscribe((event) => {
    events.append(event);
    aggregator.apply(event);
  });

  const world = new CasinoWorld({
    rng: new SeededRng(config.seed),
    clock,
    events: bus,
    botCount: config.botCount,
  });
  const hub = new ClientHub(world);
  const analytics = new AnalyticsService({ aggregator, world, clock });
  const app = await buildHttpApp({ hub, analytics, logLevel: config.logLevel });
  const loop = new GameLoop(world, () => hub.broadcastState());
  return { app, world, loop, events };
}
