import { createCasinoServer } from './CasinoServer.ts';
import { loadConfig } from './config.ts';

const config = loadConfig(process.env, Date.now() % 2 ** 31);
const server = await createCasinoServer(config, { now: () => Date.now() });

server.loop.start();
await server.app.listen({ port: config.port, host: config.host });
server.app.log.info(`Casino floor open: seed ${config.seed}, ${config.botCount} bots`);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.loop.stop();
    void server.app.close().then(() => process.exit(0));
  });
}
