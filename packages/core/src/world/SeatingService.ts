import type { PlayerId } from '@casino/contracts';
import type { Seat, Table } from '../floor/FloorMap.ts';

/** Who holds each seat. A player holds a seat from the moment they head for it. */
export class SeatingService {
  private readonly holderBySeat = new Map<string, PlayerId>();
  private readonly seatByPlayer = new Map<PlayerId, string>();

  isAvailableTo(seatId: string, playerId: PlayerId): boolean {
    const holder = this.holderBySeat.get(seatId);
    return holder === undefined || holder === playerId;
  }

  /** Takes the seat, giving up any other seat the player held. */
  claim(seatId: string, playerId: PlayerId): boolean {
    if (!this.isAvailableTo(seatId, playerId)) return false;
    this.release(playerId);
    this.holderBySeat.set(seatId, playerId);
    this.seatByPlayer.set(playerId, seatId);
    return true;
  }

  release(playerId: PlayerId): void {
    const seatId = this.seatByPlayer.get(playerId);
    if (seatId === undefined) return;
    this.seatByPlayer.delete(playerId);
    this.holderBySeat.delete(seatId);
  }

  availableSeats(table: Table, playerId: PlayerId): Seat[] {
    return table.seats.filter((seat) => this.isAvailableTo(seat.id, playerId));
  }
}
