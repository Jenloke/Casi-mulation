# Adding a game

A new game is **one class implementing `CasinoGame` plus one registry line**. Placing its
table on the floor is a data edit. Nothing in the server, game client or dashboard
changes:

- the bet form is built from `betOptions`;
- results are shown from the round's text `RoundView`;
- the dashboard lists every registered game.

The example below adds **High Card**: one card is drawn from 1 to 13; bet *high* (8–13) or
*low* (1–6). A 7 loses both, which is the house edge, and a win pays 2x.

## 1. Write the class

`packages/core/src/games/highCard/HighCardGame.ts`:

```ts
import type { BetOptionDto } from '@casino/contracts';
import type { CasinoGame, RoundContext, RoundStep, Wager } from '../CasinoGame.ts';

/** One card, 1-13. High wins on 8-13, low on 1-6; a 7 loses both. Item boost: one redraw. */
export class HighCardGame implements CasinoGame<never> {
  readonly id = 'high-card';
  readonly name = 'High Card';
  readonly minBet = 5;
  readonly maxBet = 100;
  readonly theoreticalRtp = (2 * 6) / 13; // 2x payout on 6 winning cards out of 13
  readonly betOptions: readonly BetOptionDto[] = [
    { id: 'high', label: 'High (8-K)', payout: '1:1', theoreticalRtp: 12 / 13, numberRange: null },
    { id: 'low', label: 'Low (A-6)', payout: '1:1', theoreticalRtp: 12 / 13, numberRange: null },
  ];

  isValidOption(option: string): boolean {
    return option === 'high' || option === 'low';
  }

  startRound(wager: Wager, ctx: RoundContext): RoundStep<never> {
    let card = ctx.rng.int(13) + 1;
    if (!this.wins(wager.option, card) && ctx.rng.chance(ctx.boost)) card = ctx.rng.int(13) + 1;
    const won = this.wins(wager.option, card);
    return {
      status: 'settled',
      payout: won ? wager.amount * 2 : 0,
      view: { headline: `Card: ${card}`, details: [won ? 'You win' : 'House wins'] },
    };
  }

  private wins(option: string, card: number): boolean {
    return option === 'high' ? card >= 8 : card <= 6;
  }
}
```

Rules every game follows:

- **Randomness only from `ctx.rng`.** Never use a global random source; the architecture
  test fails the build if you do.
- **`payout` is everything handed back, stake included,** and a whole number of chips.
  Pick `minBet` and multipliers so it stays whole.
- **`theoreticalRtp` is the long-run payout ÷ wager without items.** Compute it exactly
  when you can (slots enumerates its reels, baccarat its tableau); otherwise measure it once
  with a large simulation and say so in a comment, as blackjack does.
- **Every bet option carries its own `theoreticalRtp`.** When the bets differ (baccarat's tie
  returns far less than its banker bet), the game-level figure is the best bet's, which the
  table panel shows; a test checks that. The Monte Carlo suite tests each option against
  its own figure, and the dashboard's theoretical RTP weights each option by the chips
  actually wagered on it.
- **Use `ctx.boost` as a small odds boost** (it is already capped at `MAX_ODDS_BOOST`).
  The pattern so far is a re-roll of a losing outcome with probability `boost`, which can
  at most scale returns by `1 + boost`; the Monte Carlo test checks that bound.
- **Games with decisions** (like blackjack) return `{ status: 'pending', state, actions }`
  and implement `applyAction` and `suggestAction`. The suggestion is what bots and
  auto-play do, and what plays a hand out when its player disconnects.

## 2. Register it

`packages/core/src/games/defaultGames.ts`:

```ts
return new GameRegistry()
  .register(new SlotsGame())
  .register(new RouletteGame())
  .register(new BlackjackGame())
  .register(new BaccaratGame())
  .register(new HighCardGame());
```

Registry order is the game's color slot on the dashboard, so append, don't insert.

## 3. Put a table on the floor

`packages/core/src/floor/casinoFloor.ts`: add a glyph and draw the table. A connected run of
the glyph is one table, and its `o` seats must touch only that table:

```ts
tableGlyphs: { S: 'slots', R: 'roulette', B: 'blackjack', P: 'baccarat', H: 'high-card' },
rows: [
  // ...
  '#..........ooo...............#',
  '#..........HHH...............#',
  '#..........ooo...............#',
  // ...
],
```

`floor.test.ts` checks every seat is reachable from the entrance. If it fails, leave a floor
row between your table and its neighbours.

The game client draws unknown games' tables gray; give yours a felt color in `GAME_COLORS`
(`apps/game/src/phaser/FloorRenderer.ts`).

## 4. Optional: items

Add an entry to `packages/core/src/items/itemDefinitions.ts`:

```ts
{ id: 'card-counter', name: 'Card Counter', description: 'Losing draws may be redrawn.',
  gameId: 'high-card', price: 50, boost: 0.05, uses: 8 },
```

`ItemCatalog` rejects unknown games, boosts above the cap and non-positive prices or uses.

## 5. Test it

`pnpm test` already runs the data-driven Monte Carlo suite (`monteCarlo.test.ts`) against
every registered game. It checks each bet option's RTP against that option's `theoreticalRtp`,
then the first option's RTP with each item boost for that game and with the maximum boost. Add unit tests for the
rules themselves in `packages/core/test/games.test.ts`.

Bots start playing the new game straight away. Personalities without an appetite listed
for it give it weight 1; add the game id to a personality's `gameWeights` to make some bots
favor it.
