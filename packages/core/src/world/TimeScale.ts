import type { SimSpeed } from '@casino/contracts';
import type { Player } from '../players/Player.ts';

/**
 * The floor is shared, so time is too: the world runs at the fastest speed asked for by
 * a guest on auto-play, and at 1x whenever nobody is auto-playing.
 */
export class TimeScale {
  speedFor(players: readonly Player[]): SimSpeed {
    let speed: SimSpeed = 1;
    for (const player of players) {
      if (player.kind === 'human' && player.autoPlay && player.requestedSpeed > speed) {
        speed = player.requestedSpeed;
      }
    }
    return speed;
  }
}
