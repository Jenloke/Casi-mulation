import type { PlayerId } from '@casino/contracts';
import type { BotBrain } from './BotBrain.ts';

/** The brains currently driving players: every bot, plus guests on auto-play. */
export class BrainRegistry {
  private readonly brains = new Map<PlayerId, BotBrain>();

  attach(playerId: PlayerId, brain: BotBrain): void {
    this.brains.set(playerId, brain);
  }

  detach(playerId: PlayerId): void {
    this.brains.delete(playerId);
  }

  get(playerId: PlayerId): BotBrain | undefined {
    return this.brains.get(playerId);
  }

  /** A copy, safe to iterate while brains come and go. */
  entries(): [PlayerId, BotBrain][] {
    return [...this.brains.entries()];
  }
}
