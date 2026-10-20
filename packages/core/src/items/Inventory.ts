import type { GameId } from '@casino/contracts';

export interface OwnedItem {
  readonly instanceId: string;
  readonly itemId: string;
  readonly gameId: GameId;
  readonly usesLeft: number;
}

/** A player's items. At most one item per game is active; it spends a use each round of that game. */
export class Inventory {
  private readonly owned = new Map<string, OwnedItem>();
  private readonly activeByGame = new Map<GameId, string>();

  items(): readonly OwnedItem[] {
    return [...this.owned.values()];
  }

  /** Adds an item; it becomes active when nothing else is active for its game. */
  add(item: OwnedItem): void {
    this.owned.set(item.instanceId, item);
    if (!this.activeByGame.has(item.gameId)) this.activeByGame.set(item.gameId, item.instanceId);
  }

  isActive(instanceId: string): boolean {
    const item = this.owned.get(instanceId);
    return item !== undefined && this.activeByGame.get(item.gameId) === instanceId;
  }

  activeFor(gameId: GameId): OwnedItem | undefined {
    const instanceId = this.activeByGame.get(gameId);
    return instanceId === undefined ? undefined : this.owned.get(instanceId);
  }

  /** Activates the item (replacing another for its game) or switches it off. False if not owned. */
  toggle(instanceId: string): boolean {
    const item = this.owned.get(instanceId);
    if (!item) return false;
    if (this.isActive(instanceId)) this.activeByGame.delete(item.gameId);
    else this.activeByGame.set(item.gameId, instanceId);
    return true;
  }

  /** Spends one use and returns what is left. A used-up item is removed and the next one for its game takes over. */
  consumeUse(instanceId: string): number {
    const item = this.owned.get(instanceId);
    if (!item) return 0;
    const usesLeft = item.usesLeft - 1;
    if (usesLeft > 0) {
      this.owned.set(instanceId, { ...item, usesLeft });
      return usesLeft;
    }
    this.owned.delete(instanceId);
    if (this.activeByGame.get(item.gameId) === instanceId) {
      this.activeByGame.delete(item.gameId);
      const next = this.items().find((other) => other.gameId === item.gameId);
      if (next) this.activeByGame.set(item.gameId, next.instanceId);
    }
    return 0;
  }
}
