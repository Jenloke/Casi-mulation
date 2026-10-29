# Casi-mulation

A browser "RPG casino": walk a top-down, grid-based casino floor, take a seat at a table and
play slots, roulette, blackjack or baccarat alongside AI bots and other guests. A separate dashboard
shows what is happening on the floor, live.

## Requirements

- **pnpm 12** (`npm install -g pnpm@12`, or `corepack enable` on a Node that still ships it).
- **Node 26.** You don't need to install it: `pnpm install` downloads Node 26.12.0 for this
  repository (`devEngines.runtime` in `package.json`) and every `pnpm` script runs on it.
  Any Node that can run pnpm itself is enough to start.

Use pnpm, not npm. npm refuses to run inside the repository unless Node 26 is already your
global Node, because of the same `devEngines` pin.

## Run it

```sh
pnpm install
pnpm dev
```

| What | URL |
| --- | --- |
| Game | http://localhost:5173 |
| Dashboard | http://localhost:5174 |
| Server (WebSocket + API) | http://localhost:3001: `/health`, `/api/analytics` |

Open the game in a second browser tab to join as another guest.

## Playing

- **Walk** with the arrow keys or click a tile; the path is found with A\*.
- **Sit down** by clicking a table (you walk to its nearest free seat) or a seat. The
  *Walk to* panel does the same with one click.
- **Bet** in the table panel. Slots, roulette and baccarat (back the Player, the Banker or
  a Tie) settle at once; blackjack waits for *Hit* or *Stand*. Your chips are the only currency. If you run dry you get topped back up.
- **Shop** at the gold counter. Each item helps one game with a small odds boost (at most
  10%) for a limited number of rounds. One item per game is active; toggle it in the
  inventory.
- **Auto-play** hands your character to the same AI brain the bots use; the camera keeps
  following you. Pick 1x, 2x or 4x speed. The floor is shared, so the fastest speed asked
  for by an auto-playing guest applies to everyone.

## Checks

```sh
pnpm build    # type-check every package (TypeScript 7, strict) and build both web apps
pnpm lint     # Biome: lint + formatting + import order
pnpm test     # Vitest: core rules, Monte Carlo RTP per game, server, UI helpers
pnpm e2e      # Playwright smoke test; starts the server, game and dashboard itself
pnpm format   # apply Biome's fixes
pnpm ui:add dialog   # add a shadcn/ui component to the shared design system
```

Before the first `pnpm e2e`, install the browser once:
`pnpm --filter @casino/e2e exec playwright install chromium`.

## Configuration

| Variable | Default | Used by |
| --- | --- | --- |
| `CASINO_PORT` | `3001` | server |
| `CASINO_HOST` | `localhost` | server |
| `CASINO_SEED` | time-based | server: seeds every random roll of the session |
| `CASINO_BOTS` | `8` | server: bots kept on the floor |
| `CASINO_LOG_LEVEL` | `info` | server |
| `CASINO_SERVER_URL` | `http://localhost:3001` | game and dashboard dev proxies |

## Layout

| Path | What it is |
| --- | --- |
| `packages/contracts` | Message and DTO types shared by server and clients |
| `packages/core` | All game logic as plain TypeScript classes (no DOM, Node or frameworks) |
| `packages/ui` | Shared design system: shadcn/ui components, Tailwind CSS v4, the light and dark theme |
| `apps/server` | Fastify + WebSocket: runs the authoritative game loop and the analytics API |
| `apps/game` | React 19 + Vite 8 HUD (shadcn/ui) around a Phaser 4 canvas |
| `apps/dashboard` | React 19 + Vite 8 analytics dashboard (shadcn/ui) |
| `e2e` | Playwright smoke test for game + dashboard |
| `docs` | [Architecture](docs/architecture.md), [UI](docs/ui.md), [adding a game](docs/adding-a-game.md), [decisions](docs/decisions.md) |
