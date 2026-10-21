# Architecture

## The pieces

```
 apps/game (browser)                         apps/server (Node 26)
 ┌──────────────────────────────────┐        ┌────────────────────────────────────────────┐
 │ React HUD          Phaser scene  │        │ ClientHub ── execute(cmd) ──▶ CasinoWorld  │
 │      │                 │         │  WS    │   ▲  ▲                         (core)     │
 │      └──▶ GameBus ◀────┘         │◀──────▶│   │  └─ state every beat ◀─ GameLoop 100ms │
 │             ▲ ServerConnection   │  /ws   │   │                          advance()×1-4 │
 └──────────────────────────────────┘        │   │   DomainEventBus ──▶ InMemoryEventStore │
 apps/dashboard (browser)                    │   │        └──────────▶ AnalyticsAggregator │
 ┌──────────────────────────────────┐  HTTP  │   │                          │              │
 │ useAnalytics (1 s poll) ─▶ charts│◀──────▶│ GET /api/analytics ◀─ AnalyticsService     │
 └──────────────────────────────────┘        └────────────────────────────────────────────┘
        both import types from packages/contracts; only the server imports packages/core;
        both browser apps style themselves with packages/ui
```

| Package | Depends on | Responsibility |
| --- | --- | --- |
| `@casino/contracts` | nothing | Wire types: `PlayerCommand`, `ServerMessage`, floor/player/round DTOs, analytics DTOs |
| `@casino/core` | contracts | The whole game: floor, pathfinding, games, items, players, AI, domain events |
| `@casino/ui` | nothing | Design system: shadcn/ui components, the theme (light and dark), `ThemeProvider` |
| `@casino/server` | core, contracts | Real-time loop, WebSocket sessions, event store, analytics API |
| `@casino/game` | contracts, ui | Renders state and sends commands; no rules |
| `@casino/dashboard` | contracts, ui | Renders analytics |

Workspace packages export their TypeScript source. Vite, Vitest and Node 26 (native type
stripping) all run it directly, so libraries have no build output.

## Core (`packages/core/src`)

`CasinoWorld` is the facade a host drives. `advance()` runs one 100 ms simulation tick and
`execute(playerId, command)` applies a player's command. It delegates every job to a small
service:

| Folder | Classes | Job |
| --- | --- | --- |
| `floor/` | `FloorMapParser`, `FloorMap`, `casinoFloor.ts` | ASCII plan → tiles, tables, seats, shop, entrance |
| `grid/` | `AStarPathfinder`, `MinHeap` | 4-directional A\* |
| `world/` | `Navigator`, `SeatingService`, `MovementSystem` | Click/arrow → path, seat reservation, one tile per 2 ticks |
| `world/` | `RoundService`, `ShopService`, `ChipBank` | Bets/payouts/item use, buying items, topping up broke guests |
| `world/` | `CommandHandler`, `TimeScale`, `WorldSnapshotter` | Command routing, shared sim speed, DTOs for clients |
| `games/` | `CasinoGame`, `GameRegistry`, `SlotsGame`, `RouletteGame`, `BlackjackGame` | Rules, odds, theoretical RTP |
| `items/` | `ItemCatalog`, `Inventory`, `ITEM_DEFINITIONS` | Shop data, boost cap, uses, active item per game |
| `players/` | `Player`, `CharacterProfile`, `PlayerRepository` | Character state and its default look |
| `ai/` | `BotBrain`, `Personality`, `BotDirector`, `BrainRegistry` | One AI for bots and auto-play, bot population |
| `events/` | `DomainEvent`, `DomainEventBus`, `EventRecorder`, `DomainEventStore` | Every bet, payout and item use as an event |
| `random/`, `time/`, `ids/` | `SeededRng`, `WeightedTable`, `Clock`, `IdGenerator` | Injected determinism |

### A command's life

1. A client sends `{ type: 'command', command: { type: 'moveTo', target } }`.
2. `ClientHub` validates the JSON (`messageCodec.ts`) and calls `world.execute`.
3. `CommandHandler` routes it. `Navigator` turns the target into a path: a table becomes
   its nearest free seat (reserved at once), the counter becomes the nearest shop tile.
4. Each tick `MovementSystem` advances the path; arriving on the reserved seat sits the
   player down.
5. `placeBet` goes to `RoundService`. It validates the stake and debits it, applies the
   active item (capped boost, one use spent) and calls `game.startRound`. It records
   `BetPlaced` / `ItemUsed` / `PayoutSettled` through the `EventRecorder`.
6. After every beat the server sends each client `{ world, self }`. `world` is the public
   snapshot; `self` is that player's chips, inventory, table and round.

### The AI

`BotBrain` is a small state machine (idle → walk to an errand → play N rounds → leave
seat) that **issues the same `PlayerCommand`s a human sends**. Errands are: play a table,
buy an item, stroll, or walk out when broke. `Personality` only supplies numbers: game
appetite, bet size, rounds per visit, think time, shop and stroll chances, and look.
Turning auto-play on attaches a brain to the guest; the world then rejects that guest's
manual commands until it is turned off. Blackjack decisions come from the game's own
`suggestAction` (hit/stand basic strategy).

### Time and randomness

There is one seeded `Rng` for the world. Each bot's brain gets an independent `fork()`, so
`CASINO_SEED` replays a session. Event timestamps come from an injected `Clock`. The
server's `GameLoop` calls `advance()` 1, 2 or 4 times per 100 ms of real time, depending on
`TimeScale`.

## Server (`apps/server/src`)

- `CasinoServer.ts` is the composition root: world, event bus, event store, aggregator,
  hub, HTTP app and loop.
- `http/buildHttpApp.ts`: Fastify routes `GET /health`, `GET /api/analytics`, and the
  WebSocket at `GET /ws`.
- `net/ClientHub.ts`: one guest per socket; welcome message (floor, games, items), command
  relay, `rejected` replies, state broadcast.
- `analytics/`: `AnalyticsAggregator` folds events into running totals in O(1) per event.
  `RoundsTimeline` keeps 10 s buckets for the last 10 minutes. `AnalyticsService` adds who
  is online and the chip leaderboard.

## Game client (`apps/game/src`)

- `bus/`: `TypedEventBus` with a *replay* option, so a subscriber that arrives late (the
  Phaser scene boots after the first server message) still gets the latest state. React
  and Phaser share nothing else.
- `net/ServerConnection.ts`: WebSocket ⇄ bus (`net:*` events in, `command` events out),
  reconnecting after a drop.
- `phaser/`: `FloorScene` composes `FloorRenderer` (static floor), `PlayerSprites` /
  `PlayerSprite` (bodies, name tags, tweened moves, floating results) and `PlayerControls`
  (clicks → `moveTo`, arrow keys → `step`).
- `state/ClientStateStore.ts` + `ui/`: React reads bus state through
  `useSyncExternalStore` and sends commands with `useSendCommand()`. The bet form and round
  card are generic, built from each game's `betOptions` and text `RoundView`. The HUD is
  `@casino/ui` cards, buttons, fields and items over the canvas, always in the dark theme.

## Dashboard (`apps/dashboard/src`)

`useAnalytics` polls `/api/analytics` every second and keeps the last good snapshot when
the server is unreachable. Charts are hand-drawn SVG: thin bars, dumbbells, a multi-line
timeline with a crosshair. Each sits in a `ChartCard` (a card with Chart / Table tabs) with a
legend and a table view. Colors follow the reference data-viz palette through the theme's
`chart-*` tokens. Each game keeps the categorical slot of its registry position on every
chart. The page follows the OS theme; `ModeToggle` overrides it.

## UI (`packages/ui`)

shadcn/ui components on Base UI primitives (Nova style) and Tailwind CSS v4, shared by both
browser apps. `src/components`, `src/lib` and `src/hooks` are written by the shadcn CLI
(`pnpm ui:add <name>`); `src/styles/globals.css` holds the theme tokens and `src/theme` the
light/dark/system provider. Apps import `@casino/ui/globals.css` once and write no CSS of their
own. Details, token meanings and the steps for a new app: [ui.md](ui.md).

## Seams for later

- **Database:** implement `PlayerRepository` and `DomainEventStore` and pass them to
  `CasinoWorld` / `createCasinoServer`.
- **Character creation:** produce a `CharacterProfile` and pass it to `world.join(profile)`.
- **Auth:** `ClientHub.connect` is the one place a guest is created for a socket.
- **New games and items:** see [adding-a-game.md](adding-a-game.md).

## Tests

- `packages/core/test`: rules (floor parser, A\*, games, items, world flows, AI) and a
  data-driven Monte Carlo suite that checks every registered game's RTP against its
  theoretical value, with and without every item boost. `architecture.test.ts` fails if
  core uses the global random source, wall-clock time, the DOM, or Node/React/Phaser imports.
- `apps/server/test`: message validation, analytics aggregation, hub and HTTP/WebSocket wiring.
- `apps/*/src/**/*.test.ts`: UI helpers (event bus, chart geometry).
- `e2e/tests/smoke.spec.ts`: one Playwright run through walking, shopping, all three games,
  auto-play and the live dashboard.
