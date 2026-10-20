import type { PlayerId } from '@casino/contracts';
import type { Player } from './Player.ts';

/** Players on the floor. In memory today; a database adapter implements the same interface later. */
export interface PlayerRepository {
  add(player: Player): void;
  get(id: PlayerId): Player | undefined;
  remove(id: PlayerId): void;
  all(): readonly Player[];
}

export class InMemoryPlayerRepository implements PlayerRepository {
  private readonly players = new Map<PlayerId, Player>();

  add(player: Player): void {
    this.players.set(player.id, player);
  }

  get(id: PlayerId): Player | undefined {
    return this.players.get(id);
  }

  remove(id: PlayerId): void {
    this.players.delete(id);
  }

  all(): readonly Player[] {
    return [...this.players.values()];
  }
}
