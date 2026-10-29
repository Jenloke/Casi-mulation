import { BaccaratGame } from './baccarat/BaccaratGame.ts';
import { BlackjackGame } from './blackjack/BlackjackGame.ts';
import { GameRegistry } from './GameRegistry.ts';
import { RouletteGame } from './roulette/RouletteGame.ts';
import { SlotsGame } from './slots/SlotsGame.ts';

/** Every game in the casino. Adding a game is one class plus one line here. */
export function createDefaultGameRegistry(): GameRegistry {
  return new GameRegistry()
    .register(new SlotsGame())
    .register(new RouletteGame())
    .register(new BlackjackGame())
    .register(new BaccaratGame());
}
