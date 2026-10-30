Build a pnpm + Turborepo monorepo for a browser game: a top-down, grid-based "RPG casino" where players walk a casino floor and play games at tables in the middle, alongside other players.

Stack (check npm for the latest stable versions before installing; use Phaser 4 APIs, not Phaser 3):
- Node 26, TypeScript 7 strict everywhere, Biome for lint + format (no ESLint: typescript-eslint doesn't support TS 7 yet)
- packages/core: all game logic as plain TS classes; no DOM, Node or framework imports
- packages/contracts: shared message and DTO types
- apps/server: Fastify + WebSocket; runs the authoritative game loop and the analytics API
- apps/game: React 19 + Vite 8 app hosting a Phaser 4 canvas. Phaser draws the world; HUD and menus (chips, inventory, bet panel) are React components. React and Phaser talk only through a typed event bus.
- apps/dashboard: React 19 + Vite 8 casino analytics dashboard (no Next.js), separate from the game

Game v1, keep it simple:
- Tile-grid floor defined as data (ASCII map): tables in the center with seat tiles, a shop counter, an entrance. Arrow keys or click-to-move (A* pathfinding). Placeholder shapes, no art.
- Games: slots, roulette, blackjack. The only currency is chips.
- Other players: AI bots with a few simple personalities share the floor and tables. A second browser tab joins as another guest player; no auth yet.
- Auto-play toggle: my character uses the same AI brain as the bots while I watch (camera follow, sim speed 1x/2x/4x).
- Inventory: items bought with chips at the shop, each tied to one game, giving a small capped odds boost for limited uses. Ship 3-5 examples.
- One default character; keep appearance/profile in its own type with defaults so character creation can be added later.
- No database yet: in-memory repositories behind interfaces, so a DB adapter drops in later.
- Every bet, payout and item use is a domain event; the server aggregates them for the dashboard.

Dashboard (live): chips wagered/paid per game, actual vs theoretical RTP, rounds over time, players vs bots, item usage and its effect on win rate, chip leaderboard.

Code rules:
- Small, single-purpose, readable classes. Phaser scenes and React components only render and send commands; no game logic in them.
- Seeded RNG injected everywhere; no Math.random in core.
- Adding a game = one class implementing a CasinoGame interface + one registry line. Adding an item = one data entry.
- Vitest for core, including a Monte Carlo test per game that checks RTP stays in range with and without items. One Playwright smoke test for game + dashboard.
- Write README.md (how to run), docs/architecture.md, docs/adding-a-game.md, and CLAUDE.md (architecture + conventions for future work).

Build in this order: core → server → game → dashboard. After each, run build, lint and tests and fix failures before moving on. Don't stop to ask; make sensible calls and log them in docs/decisions.md. Done when `pnpm install && pnpm dev` starts all three apps, all checks pass, and I can walk the floor, play each game, buy and use an item, toggle auto-play, and watch the dashboard update.

Commit each logical change on its own, with a message that explains it.