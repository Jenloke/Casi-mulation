import type { GameId } from '@casino/contracts';
import type { CasinoGame } from './CasinoGame.ts';

/** The games the casino offers, by id. */
export class GameRegistry {
  private readonly games = new Map<GameId, CasinoGame>();

  register(game: CasinoGame): this {
    if (this.games.has(game.id)) throw new Error(`Game '${game.id}' is already registered`);
    this.games.set(game.id, game);
    return this;
  }

  get(id: GameId): CasinoGame | undefined {
    return this.games.get(id);
  }

  all(): readonly CasinoGame[] {
    return [...this.games.values()];
  }
}
