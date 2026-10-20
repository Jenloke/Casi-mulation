import { ANALYTICS_PATH, GAME_SOCKET_PATH } from '@casino/contracts';
import websocket from '@fastify/websocket';
import Fastify, { type FastifyInstance } from 'fastify';
import type { AnalyticsService } from '../analytics/AnalyticsService.ts';
import type { ClientHub } from '../net/ClientHub.ts';

export interface HttpAppDeps {
  readonly hub: ClientHub;
  readonly analytics: AnalyticsService;
  readonly logLevel: string;
}

/** The Fastify app: the game WebSocket, the analytics API and a health check. */
export async function buildHttpApp(deps: HttpAppDeps): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: deps.logLevel } });
  await app.register(websocket);

  app.get('/health', async () => ({ ok: true }));
  app.get(ANALYTICS_PATH, async () => deps.analytics.snapshot());
  app.get(GAME_SOCKET_PATH, { websocket: true }, (socket) => {
    const playerId = deps.hub.connect(socket);
    socket.on('message', (data) => deps.hub.receive(playerId, String(data)));
    socket.on('close', () => deps.hub.disconnect(playerId));
  });
  return app;
}
