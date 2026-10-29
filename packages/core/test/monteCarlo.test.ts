import { describe, expect, it } from 'vitest';
import { createDefaultGameRegistry } from '../src/games/defaultGames.ts';
import { MAX_ODDS_BOOST } from '../src/items/ItemDefinition.ts';
import { ITEM_DEFINITIONS } from '../src/items/itemDefinitions.ts';
import { optionsToTest, simulateRtp } from './support/simulate.ts';

const ROUNDS = 200_000;
/** How many standard errors a simulated RTP may sit away from its target. */
const Z = 4;

const games = createDefaultGameRegistry()
  .all()
  .map((game) => [game.name, game] as const);

describe.each(games)('%s Monte Carlo', (_name, game) => {
  it.each(optionsToTest(game))(
    'bet "$option" returns its theoretical RTP without items',
    ({ option, theoreticalRtp }) => {
      const { rtp, standardError } = simulateRtp(game, {
        rounds: ROUNDS,
        seed: 2024,
        boost: 0,
        option,
      });
      expect(Math.abs(rtp - theoreticalRtp)).toBeLessThan(Z * standardError);
    },
  );

  const itemBoosts = ITEM_DEFINITIONS.filter((item) => item.gameId === game.id).map((i) => i.boost);
  it.each([...new Set([...itemBoosts, MAX_ODDS_BOOST])])(
    'stays in range with a %s odds boost',
    (boost) => {
      const [first] = optionsToTest(game);
      if (!first) throw new Error(`${game.id} has no bet options`);
      const { option, theoreticalRtp } = first;
      const { rtp, standardError } = simulateRtp(game, { rounds: ROUNDS, seed: 7, boost, option });
      // Items never hurt, and can at most scale returns by (1 + boost).
      expect(rtp).toBeGreaterThan(theoreticalRtp - Z * standardError);
      expect(rtp).toBeLessThan(theoreticalRtp * (1 + boost) + Z * standardError);
    },
  );
});
