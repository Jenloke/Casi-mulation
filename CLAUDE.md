# CLAUDE.md

Browser "RPG casino": pnpm + Turborepo monorepo. Read `docs/architecture.md` for the full
picture and `docs/decisions.md` before changing a behavior that looks deliberate.

## Commands

```sh
pnpm install          # also downloads Node 26 (devEngines.runtime); use pnpm, never npm
pnpm dev              # server :3001, game :5173, dashboard :5174
pnpm build            # tsc (TypeScript 7) everywhere + vite builds; libs only type-check
pnpm lint             # biome check .   (pnpm format applies fixes)
pnpm test             # vitest in every package
pnpm e2e              # Playwright smoke test; starts all three apps itself
pnpm --filter @casino/core test monteCarlo   # one package / one file
pnpm ui:add dialog    # add a shadcn/ui component to packages/ui (pinned CLI, run in that package)
```

Every change should leave `pnpm build`, `pnpm lint`, `pnpm test` and `pnpm e2e` green.

## Layout and dependency rules

- `packages/contracts`: wire types only. It depends on nothing.
- `packages/core`: **all game logic**, as plain TS classes. No DOM, Node or framework
  imports, no global random source, no wall-clock time. Enforced by Biome
  (`noNodejsModules`) and `packages/core/test/architecture.test.ts`. Inject `Rng` and
  `Clock`.
- `apps/server`: the only consumer of core. It composes the world (`CasinoServer.ts`),
  runs the loop and serves analytics.
- `apps/game`, `apps/dashboard`: render and send commands. **No game logic.** Phaser and
  React talk only through the typed `GameBus` (`apps/game/src/bus`).
- `packages/ui`: the design system for every browser app: shadcn/ui on Base UI (Nova style),
  Tailwind v4 and the theme tokens. Read `docs/ui.md` before UI work. Apps **write no CSS**:
  import `@casino/ui/globals.css` once and style with `@casino/ui` components plus Tailwind
  utilities on semantic tokens (`bg-card`, `text-muted-foreground`); no hex colors in app code
  (the Phaser canvas excepted).

## Conventions

- Small, single-purpose classes; a facade (`CasinoWorld`) delegates to services.
- **Erasable TypeScript only.** Node runs the server's TS directly, so: no enums,
  namespaces or constructor parameter properties; `import type` for types; relative
  imports end in `.ts`/`.tsx`.
- Strict TS 7 plus `noUncheckedIndexedAccess`: handle `undefined` from index access
  instead of using `!` (Biome forbids non-null assertions).
- Biome formats: single quotes, 2-space indent, 100 columns. Run `pnpm format` rather than
  hand-formatting.
- Commands are the only way to change the world, for humans and for `BotBrain` alike. New
  behavior = a new `PlayerCommand` in contracts, validation in
  `apps/server/src/net/messageCodec.ts`, a route in `CommandHandler`, and a service method.
- Anything touching chips or items records a domain event through `EventRecorder`. The
  server's `AnalyticsAggregator` folds events; it never reads world state for totals.
- Repositories (`PlayerRepository`, `DomainEventStore`) are interfaces with in-memory
  implementations. Keep it that way so a database adapter can drop in.
- Character look and name live in `CharacterProfile`; extend it, don't put look fields on
  `Player`.
- Files in `packages/ui/src/{components,hooks,lib}` are vendored shadcn code: change them only
  through `pnpm ui:add` (`--diff` to compare, `--overwrite` to update). Biome lints them but
  doesn't format them. Never run `shadcn init`/`apply`; they would replace the hand-tuned theme.
- No arrow-key focus groups (`ToggleGroup`, `RadioGroup`, `Tabs`) in the game HUD: they cancel
  arrow keys and the character stops walking. Use `aria-pressed` buttons for choices.

## Extending

- **Game:** one class implementing `CasinoGame` + one line in
  `games/defaultGames.ts` + a glyph/table in `floor/casinoFloor.ts`. See
  `docs/adding-a-game.md`. The Monte Carlo suite picks it up automatically.
- **Item:** one entry in `items/itemDefinitions.ts` (boost ≤ `MAX_ODDS_BOOST`).
- **Bot personality:** one entry in `ai/personalities.ts`.
- **UI component:** `pnpm ui:add <name>`, then import `@casino/ui/components/<name>`.
- **Web app:** the five steps in `docs/ui.md` (deps, Tailwind plugin, `globals.css`,
  `components.json`, dark-mode setup).

## Testing notes

- Use `SeededRng` and `ManualClock` for deterministic tests. `runUntil(world, condition)`
  in `world.test.ts` drives ticks.
- Monte Carlo tests compare against `theoreticalRtp` within 4 standard errors. If you
  change a paytable, fix the theoretical value instead of loosening the tolerance.
- The e2e test relies on `data-testid`s in the HUD (`chip-count`, `player-pos`,
  `table-panel`, `shop-panel`, `inventory-panel`, `round-result`, ...) and the dashboard
  (`total-rounds`, `humans-online`, `leaderboard`), and on button names (`Shop`, `Place bet`,
  `Spin`, `Deal`, `Stand`, `Leave table`, `Start auto-play`, `4x`, `Buy <item>`). Keep them stable.

## Decisions

Log non-obvious calls in `docs/decisions.md` (what and why), and commit after each
milestone.
