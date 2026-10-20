# Decisions

Judgment calls made while building v1, newest milestone last. Each entry says what was
decided and why, so it can be revisited deliberately.

## Toolchain

- **Node 26 comes from pnpm, not the machine.** The root `package.json` declares
  `devEngines.runtime` (node 26.12.0, `onFail: download`), so `pnpm install` fetches Node 26
  and every `pnpm run` script uses it, whatever Node is installed globally. `.nvmrc` says 26
  for people who manage Node themselves.
- **Workspace packages ship TypeScript source.** `@casino/core` and `@casino/contracts` export
  `src/index.ts`; Vite, Vitest and Node 26 (native type stripping) all read it directly, so
  there is no library build step. Their `build` task is a strict type-check.
- **Erasable TypeScript only.** Because Node strips types instead of compiling, the base
  tsconfig sets `erasableSyntaxOnly`, `verbatimModuleSyntax` and `.ts` import extensions. No
  enums, namespaces or constructor parameter properties.
- **TypeScript 7 strict plus extras** (`noUncheckedIndexedAccess`, `noImplicitReturns`,
  `noUnused*`, `noImplicitOverride`).
- **Biome is the only linter/formatter.** `pnpm lint` runs `biome check` (lint + format +
  import order). Core purity is enforced twice: Biome's `noNodejsModules` on core/contracts,
  and `packages/core/test/architecture.test.ts`, which fails if core source uses the global
  random source, wall-clock time, the DOM, or imports Node/React/Phaser/Fastify.

## Floor and movement

- **ASCII legend:** `#` wall, `.` floor, `E` entrance, `$` shop counter, `c` shop tile,
  `o` seat, plus one letter per game (`S`, `R`, `B`). A connected run of one letter is one
  table; a seat belongs to the single table it touches (the parser rejects ambiguous seats
  and seatless tables).
- **4-directional A\*,** Manhattan heuristic, deterministic tie-breaking. Players do not block
  each other (no deadlocks in a crowd); seats are passable only as a destination so nobody
  walks through a seated player.
- **Seats are reserved when a player heads for them,** so two players never race for one.
  Clicking a table walks to its nearest free seat; clicking the counter walks to the nearest
  shop tile.
- **Movement speed:** one tile per 2 ticks; 1 tick = 100 ms of simulated time.

## Games

- **Each seat plays its own rounds against the house.** Tables are shared spaces, not shared
  rounds; there is no common dealer timer to wait for.
- **Slots:** three identical weighted reels; theoretical RTP is computed exactly by enumerating
  every combination (95.925%).
- **Roulette:** European single zero; all bets return 36/37.
- **Blackjack:** infinite shoe, dealer stands on soft 17, dealer peeks, blackjack pays 3:2
  (rounded down to whole chips), hit/stand only (no double, split or surrender) to keep v1
  small. Its theoretical RTP is the basic-strategy return measured over 10M simulated rounds,
  stored as a constant on `BlackjackGame`.
- **A player can't walk away from a round that is waiting for their decision.** If they
  disconnect mid-hand, the AI finishes the hand for them so every bet still settles.

## Items

- **Odds boosts are per game, capped at `MAX_ODDS_BOOST` (10%).** Slots and roulette give a
  losing spin a `boost` chance of one re-spin; blackjack gives a busting hit a `boost` chance
  to be redrawn. A re-roll can at most scale returns by `1 + boost`, which the Monte Carlo
  tests assert.
- **One active item per game.** A new item auto-activates if nothing is active for its game;
  each round of that game spends one use; a used-up item hands over to the next one owned.

## Players and AI

- **One brain for everyone.** `BotBrain` issues the same `PlayerCommand`s a human client sends.
  Bots differ only by `Personality` numbers; auto-play attaches a brain with the "balanced"
  personality to the guest.
- **Shared world, shared clock.** Simulation speed is global: the fastest speed requested by a
  guest who is auto-playing, and 1x as soon as nobody is.
- **Broke guests are topped back up** (a `ChipsGranted` event) so a demo never dead-ends;
  broke bots walk out and the director replaces them.
- **Guests are anonymous** ("Guest N") with the default character profile; no auth yet.

## Events and storage

- **Domain events live in core** (`BetPlaced`, `PayoutSettled`, `ItemUsed`, `ItemPurchased`,
  `PlayerJoined`, `PlayerLeft`, `ChipsGranted`) and are published through an injected
  publisher, stamped by an injected clock.
- **Repositories are interfaces** (`PlayerRepository`, `DomainEventStore`) with in-memory
  implementations. The event store keeps a bounded window in memory so a long session can't
  exhaust it; aggregates are kept incrementally and never need a replay.
