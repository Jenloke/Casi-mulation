import type { GameId } from '@casino/contracts';
import type { GameRegistry } from '../games/GameRegistry.ts';
import { type ItemDefinition, MAX_ODDS_BOOST } from './ItemDefinition.ts';

/** The items for sale, validated against the games and the boost cap. */
export class ItemCatalog {
  private readonly items = new Map<string, ItemDefinition>();

  constructor(definitions: readonly ItemDefinition[], games: GameRegistry) {
    for (const item of definitions) {
      if (this.items.has(item.id)) throw new Error(`Duplicate item '${item.id}'`);
      if (!games.get(item.gameId)) {
        throw new Error(`Item '${item.id}' is for unknown game '${item.gameId}'`);
      }
      if (!(item.boost > 0 && item.boost <= MAX_ODDS_BOOST)) {
        throw new Error(`Item '${item.id}' boost must be in (0, ${MAX_ODDS_BOOST}]`);
      }
      if (!Number.isInteger(item.uses) || item.uses <= 0) {
        throw new Error(`Item '${item.id}' needs a positive whole number of uses`);
      }
      if (!Number.isInteger(item.price) || item.price <= 0) {
        throw new Error(`Item '${item.id}' needs a positive whole price`);
      }
      this.items.set(item.id, item);
    }
  }

  get(id: string): ItemDefinition | undefined {
    return this.items.get(id);
  }

  all(): readonly ItemDefinition[] {
    return [...this.items.values()];
  }

  forGame(gameId: GameId): readonly ItemDefinition[] {
    return this.all().filter((item) => item.gameId === gameId);
  }
}
