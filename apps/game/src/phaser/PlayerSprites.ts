import type { PlayerId, StateMessage } from '@casino/contracts';
import type * as Phaser from 'phaser';
import { PlayerSprite } from './PlayerSprite.ts';

/** Keeps one sprite per player in the latest snapshot. */
export class PlayerSprites {
  private readonly scene: Phaser.Scene;
  private readonly sprites = new Map<PlayerId, PlayerSprite>();
  private localId: PlayerId | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Your own marker, for the camera to follow. */
  get local(): Phaser.GameObjects.Container | undefined {
    return this.localId === null ? undefined : this.sprites.get(this.localId)?.container;
  }

  sync(state: StateMessage): void {
    this.localId = state.self.playerId;
    const present = new Set<PlayerId>();
    for (const player of state.world.players) {
      present.add(player.id);
      const sprite = this.sprites.get(player.id);
      if (sprite) sprite.update(player, state.world.simSpeed);
      else
        this.sprites.set(
          player.id,
          new PlayerSprite(this.scene, player, player.id === this.localId),
        );
    }
    for (const [id, sprite] of this.sprites) {
      if (present.has(id)) continue;
      sprite.destroy();
      this.sprites.delete(id);
    }
  }

  clear(): void {
    for (const sprite of this.sprites.values()) sprite.destroy();
    this.sprites.clear();
  }
}
