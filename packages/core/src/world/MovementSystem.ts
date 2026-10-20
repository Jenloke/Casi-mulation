import type { Player } from '../players/Player.ts';

/** Walks players along their paths, one tile every `ticksPerStep` ticks. */
export class MovementSystem {
  private readonly ticksPerStep: number;

  constructor(ticksPerStep: number) {
    this.ticksPerStep = ticksPerStep;
  }

  /** Moves the player a tile when its step cooldown allows; true when this tick ends its path. */
  advance(player: Player): boolean {
    if (player.stepCooldown > 0) player.stepCooldown--;
    if (player.stepCooldown > 0) return false;
    const next = player.path.shift();
    if (!next) return false;
    player.pos = next;
    player.stepCooldown = this.ticksPerStep;
    return player.path.length === 0;
  }
}
