# Decisions

Judgment calls made while building v1, newest topic last. Each entry says what was
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
  `o` seat, plus one letter per game (`S`, `R`, `B`, `P`). A connected run of one letter is one
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

## Server

- **Node runs the server's TypeScript directly** (`node src/main.ts`, `node --watch` in dev),
  so the server's `build` is a type-check and there is nothing to deploy but source.
- **Fixed 100 ms beat.** Each beat advances the world 1, 2 or 4 ticks (the shared speed),
  then sends every client the public snapshot (serialized once) plus its private state.
  Ten messages a second is plenty for a tile game; the client tweens between tiles.
- **One guest per WebSocket, no auth.** A reconnect is a new guest. Commands from the wire
  are validated field by field before they reach core; malformed ones are dropped.
- **RTP = paid ÷ wagered.** Wagers are counted at `BetPlaced`, payouts at `PayoutSettled`,
  so a blackjack hand that is still open counts as wagered but not yet paid; the
  difference is a handful of chips at most.
- **Timeline buckets are 10 s wide, last 10 minutes,** on wall-clock time, so running at 4x
  visibly increases rounds per bucket.
- **The leaderboard is who is on the floor now** (current chips). Bots that walked out
  leave the board.
- **Fastify listens on `localhost`,** which binds both IPv4 and IPv6 loopback, so the Vite
  proxies work whichever one `localhost` resolves to.

## Game client

- **Thin client.** The game app depends only on `@casino/contracts`; the floor, games and
  items arrive in the welcome message. No rules run in the browser.
- **The event bus remembers the latest payload per event** and can replay it to a new
  subscriber, because the Phaser scene finishes booting after the first state arrives.
  The scene unsubscribes on both shutdown and destroy (React StrictMode creates the game
  twice in development).
- **Clicks become `moveTo`**, and the server works out the intent: table → free seat,
  counter → shop tile. The "Walk to" buttons send the same command, so they are a
  shortcut, not a second code path.
- **Arrow keys are polled, not captured,** so they still work in the HUD's number inputs.
  Steps repeat every 160 ms while a key is held.
- **Camera zoom is fixed at 1.5x and follows your character,** clamped to the floor, which
  centers it when the window is larger than the zoomed floor.

## Dashboard

- **Polling, not push.** `/api/analytics` is polled every second: simplest thing that is
  live enough, and the server's snapshot is cheap (aggregates are precomputed).
- **Colors follow the reference data-viz palette.** Each game owns the categorical slot of
  its registry position on every chart, so a color always means the same game. The three
  game colors pass the palette validator all-pairs in light and dark. Light-mode aqua sits
  at 2.74:1 against the surface, which the visible row labels and table views relieve.
  Guests vs bots uses the emphasis form (guests violet, bots gray).
- **Every chart has a table view** and a legend; tooltips add detail but never hold the
  only copy of a value.
- **Hand-drawn SVG instead of a chart library:** six small charts didn't justify a
  dependency, and it keeps the mark specs (thin bars, rounded data ends, hairline grids)
  exact.

## Testing

- **The Monte Carlo suite is data-driven over the game registry,** so every game, current
  or future, gets an RTP test per bet option, with and without each of its item boosts.
  The tolerance is 4 standard errors of the simulated estimate, not a magic number.
- **One Playwright smoke test** starts the server (6 bots, seed 7), the game and the
  dashboard. It walks, buys an item, plays every game, turns on auto-play at 4x and
  checks the dashboard updates. It also fails on any uncaught page error.
- **npm is not supported inside the repository:** npm enforces `devEngines.runtime`
  strictly and refuses to run on a non-26 Node. pnpm reads the same field and downloads
  Node 26 instead.

## Design system

- **One design system package, `@casino/ui`.** shadcn/ui lives in `packages/ui` and every web
  app, current or future, styles itself with it. It follows shadcn's own monorepo layout (a
  `components.json` in every workspace, components installed into the shared package) so the
  CLI keeps working. How to use it: [ui.md](ui.md).
- **Base UI primitives, Nova style, Geist, lucide icons.** These are the shadcn CLI defaults.
  Base UI is its recommended library, and Nova's tighter spacing suits a HUD sidebar and a
  data-dense dashboard alike.
- **Apps write no CSS.** Each app imports `@casino/ui/globals.css` and styles with Tailwind
  utilities on semantic tokens; both `styles.css` files are gone. Chart chrome has tokens too
  (`chart-grid`, `chart-axis`, `chart-muted`, `chart-deemphasis`), so SVG marks use utilities.
- **The theme is the reference data-viz palette plus casino gold.** The neutral tokens are the
  reference chrome values (page `#f9f9f7` / `#0d0d0d`, surface `#fcfcfb` / `#1a1a19`, the inks,
  grid and axis), so the dashboard's series colors still render on the surfaces they were
  validated against. Re-run after the move: the three game colors pass all-pairs in both modes;
  light aqua stays at 2.74:1, relieved by the row labels and table views. `chart-1` to `chart-8`
  are the eight categorical slots.
- **Gold is chosen per mode.** Dark mode keeps the game's accent `#e6b84a` with dark text
  (9.9:1). Light mode uses `#8a6514` with near-white text, which passes 5.2:1 both as a fill and
  as text; bright gold as text on the light surface would be 1.8:1.
- **Dark `destructive` is `#e5534b`, not the reference critical `#d03b3b`.** shadcn uses
  `destructive` as text (alerts, error badges) and `#d03b3b` is 3.6:1 on the dark card, where
  `#e5534b` is 4.7:1. Light mode keeps `#d03b3b` (4.7:1). A `success` token (`#006300` /
  `#0ca30c`, the reference success-text steps) marks wins.
- **The game HUD is always dark; the dashboard follows the OS.** The game sets `class="dark"` on
  `<html>`. The dashboard uses `ThemeProvider` and `ModeToggle` (light / dark / system, kept in
  `localStorage` as `casino-theme`) plus an inline script in `index.html` that sets the class
  before the first paint, so dark-mode users see no light flash. The Phaser canvas background is
  the dark `--background` (`#0d0d0d`), so the floor's edge meets the HUD.
- **No arrow-key focus groups in the game HUD.** Base UI's ToggleGroup, RadioGroup and Tabs move
  focus with the arrow keys and cancel the event; Phaser ignores cancelled key events, so the
  character would stop walking whenever one had focus. Speed and bet choices stay `aria-pressed`
  buttons, which also keeps the e2e selectors. The dashboard has no keyboard conflict and uses
  `Tabs` for chart and table views. Start/stop auto-play lost `aria-pressed`: its label already
  changes with the state.
- **Rejected-command notices are `Alert`s** (`role="alert"`), announced once and at once; the
  container's `aria-live` would have announced them twice.
- **Vendored shadcn files stay as the CLI writes them.** Biome lints
  `packages/ui/src/{components,hooks,lib}` but doesn't format them or sort their imports, and
  turns off the five rules upstream code trips (`useSemanticElements`, `noLabelWithoutControl`,
  `useImportType`, `noArrayIndexKey`, `noDoubleEquals`). That keeps `shadcn add --diff` and
  `--overwrite` free of formatting noise. Repo-authored UI code (`src/theme`, the apps) is fully
  linted and formatted, and Biome parses Tailwind directives (`css.parser.tailwindDirectives`).
- **`shadcn` is a dependency of `packages/ui`.** `globals.css` imports `shadcn/tailwind.css` (the
  data-attribute variants and animations Base UI components need), and the package pins the CLI
  that `pnpm ui:add` runs. Only that CSS reaches the browser.
- **`saveExact: true` in `pnpm-workspace.yaml`.** The shadcn CLI installs dependencies with
  `pnpm add`; this pins them to exact versions like everything else in the repo.
- **Workarounds for shadcn CLI 4.22 on Windows.** With a dot anywhere in the path, the CLI cuts
  resolved alias directories at that dot, and its workspace lookup compares `\` against `/`.
  `packages/ui` therefore exports `./components`, `./hooks` and `./lib` as directories (an exact
  match skips the bad code path; nothing imports them), and `pnpm ui:add` runs the CLI inside
  `packages/ui`. Drop both once shadcn fixes the bugs.

## Baccarat

- **Punto banco on an infinite shoe.** Player, Banker and Tie bets; the tableau draws every
  third card, so the round settles at once like roulette. The infinite shoe matches
  blackjack, keeps rounds independent (each seat plays its own rounds, so there is no shared
  shoe to track) and makes the odds exactly computable: `coupOdds` walks the tableau over
  hand totals (10^4 paths). House edges come out at 1.064% banker, 1.228% player and 14.12%
  tie, the published infinite-deck figures.
- **Banker wins pay 0.95:1, the 5% commission rounded up to a whole chip;** tie pays 8:1 and
  hands player and banker bets back. The minimum bet is 20, the smallest stake whose
  commission is a whole chip, so the theoretical RTP (computed at the minimum bet) is exact
  there. Other stakes pay up to one chip less, as blackjack's rounded 3:2 does.
- **Every bet option carries its own theoretical RTP** (`BetOptionDto.theoreticalRtp`).
  Baccarat's bets differ by 13 points, so one number per game could neither be tested per
  option nor compared with what was actually bet. The game-level figure is the best bet's
  (banker, 98.94%), what a casino quotes and what the table panel shows.
- **The dashboard's theoretical RTP is weighted by the bets actually placed:** each option's
  RTP times the chips wagered on it, over the chips wagered (the game's own figure before
  any bet). Bots pick bet options uniformly, so baccarat's mix sits near 94.5%; comparing
  that with the banker's 98.9% would read as a bug. Games whose bets all share one RTP are
  unchanged.
- **Item boost: a losing coup may be dealt again once,** the same re-roll as the other
  games, so returns scale by at most `1 + boost`. **No baccarat item ships:** the spec asks
  for 3-5 example items and five already exist (`items.test.ts` enforces it). The Monte
  Carlo suite still checks the boost at `MAX_ODDS_BOOST`; an item is one entry away.
- **Floor:** two 4-wide `P` tables (8 seats each) between the roulette and blackjack columns,
  with two-tile aisles on each side. High rollers favor baccarat (appetite 5).
- **Shared cards:** `cards.ts` moved from `games/blackjack/` to `games/`, since both card
  games deal from the same infinite shoe.
- **Fourth chart color:** baccarat takes categorical slot 4 (amber). Slots 1-4 pass the
  palette validator on adjacent pairs in both modes, which is the check for the dashboard's
  forms (lines, and one labeled row per game). All-pairs no longer passes (amber against
  orange): the reference palette only clears all-pairs for its first three slots, so a fifth
  game, or any all-pairs form like a scatter, needs facets or an "Other" fold. Light amber is
  2.11:1 on the surface, relieved like aqua by row labels, the line end labels and the table
  views.

## Commits

- **One logical change per commit, not one commit per milestone.** "Milestone" never said how
  big a step was or what belonged in it, so each commit became everything since the last one:
  up to 85 files and 5,600 lines, too much to review, revert or bisect. `CLAUDE.md` now defines
  the unit itself: one change, a `type(scope): summary` subject and green checks.
- **The existing history was rewritten to match.** Six bundled commits became 85 small ones.
  Each original commit's tree was reproduced exactly (checked by tree hash), so only the steps
  between them are new. Author dates are the originals; committer dates show the rewrite. The
  merge of PR #1 keeps its place. A few in-between states never existed before: placeholder
  `main.tsx` entry points while each app was assembled, and both stylesheets loaded while the
  apps moved to the design system.
