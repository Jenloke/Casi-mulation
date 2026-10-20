export interface ServerConfig {
  readonly port: number;
  readonly host: string;
  readonly seed: number;
  readonly botCount: number;
  readonly logLevel: string;
}

/** Reads CASINO_* environment variables, falling back to development defaults. */
export function loadConfig(
  env: Readonly<Record<string, string | undefined>>,
  fallbackSeed: number,
): ServerConfig {
  return {
    port: integer(env.CASINO_PORT, 3001),
    // 'localhost' makes Fastify listen on both the IPv4 and IPv6 loopback.
    host: env.CASINO_HOST ?? 'localhost',
    seed: integer(env.CASINO_SEED, fallbackSeed),
    botCount: integer(env.CASINO_BOTS, 8),
    logLevel: env.CASINO_LOG_LEVEL ?? 'info',
  };
}

function integer(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return value !== undefined && Number.isInteger(parsed) ? parsed : fallback;
}
