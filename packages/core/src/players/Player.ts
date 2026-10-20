import type { GridPos, PlayerId, PlayerKind, SimSpeed } from '@casino/contracts';
import { Inventory } from '../items/Inventory.ts';
import type { PendingRound, SettledRound } from '../rounds/RoundRecords.ts';
import type { CharacterProfile } from './CharacterProfile.ts';

export interface PlayerInit {
  readonly id: PlayerId;
  readonly kind: PlayerKind;
  readonly profile: CharacterProfile;
  readonly chips: number;
  readonly pos: GridPos;
}

/** A character on the floor, human or bot. Only the world's services change it. */
export class Player {
  readonly id: PlayerId;
  readonly kind: PlayerKind;
  readonly profile: CharacterProfile;
  readonly inventory = new Inventory();
  chips: number;
  pos: GridPos;
  /** Tiles left to walk, next tile first. */
  path: GridPos[] = [];
  /** Seat the player holds: walking to it, or sitting on it once `seated`. */
  seatId: string | null = null;
  seated = false;
  stepCooldown = 0;
  autoPlay = false;
  requestedSpeed: SimSpeed = 1;
  pendingRound: PendingRound | null = null;
  lastRound: SettledRound | null = null;

  constructor(init: PlayerInit) {
    this.id = init.id;
    this.kind = init.kind;
    this.profile = init.profile;
    this.chips = init.chips;
    this.pos = init.pos;
  }

  get name(): string {
    return this.profile.name;
  }

  get isMoving(): boolean {
    return this.path.length > 0;
  }

  canAfford(amount: number): boolean {
    return amount <= this.chips;
  }

  debit(amount: number): void {
    if (!this.canAfford(amount)) throw new RangeError(`${this.name} cannot afford ${amount} chips`);
    this.chips -= amount;
  }

  credit(amount: number): void {
    this.chips += amount;
  }
}
