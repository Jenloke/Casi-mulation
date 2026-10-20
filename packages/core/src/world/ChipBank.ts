import type { EventRecorder } from '../events/EventRecorder.ts';
import type { Player } from '../players/Player.ts';

/** Guests who run dry are topped back up so they can keep playing; bots walk out instead. */
export class ChipBank {
  private readonly recorder: EventRecorder;
  private readonly topUpTo: number;
  private readonly brokeBelow: number;

  constructor(recorder: EventRecorder, topUpTo: number, brokeBelow: number) {
    this.recorder = recorder;
    this.topUpTo = topUpTo;
    this.brokeBelow = brokeBelow;
  }

  topUpIfBroke(player: Player): void {
    if (player.kind !== 'human' || player.pendingRound || player.chips >= this.brokeBelow) return;
    const amount = this.topUpTo - player.chips;
    player.credit(amount);
    this.recorder.record(player, { type: 'ChipsGranted', amount });
  }
}
