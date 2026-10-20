import type { Direction, GridPos } from '@casino/contracts';
import type { FloorMap, Seat, Table } from '../floor/FloorMap.ts';
import { AStarPathfinder } from '../grid/AStarPathfinder.ts';
import { manhattan, neighbors, samePos, step } from '../grid/gridMath.ts';
import type { Player } from '../players/Player.ts';
import { type CommandResult, OK, rejected } from './CommandResult.ts';
import type { SeatingService } from './SeatingService.ts';

/**
 * Turns "go there" into an A* path. A click on a table means its nearest free seat,
 * a click on the shop counter means the nearest shop tile.
 */
export class Navigator {
  private readonly floor: FloorMap;
  private readonly seating: SeatingService;
  private readonly pathfinder = new AStarPathfinder();

  constructor(floor: FloorMap, seating: SeatingService) {
    this.floor = floor;
    this.seating = seating;
  }

  moveTo(player: Player, target: GridPos): CommandResult {
    const table = this.floor.tableAt(target);
    if (table) return this.walkToTable(player, table);
    const seat = this.floor.seatAt(target);
    if (seat) {
      if (this.seating.isAvailableTo(seat.id, player.id)) return this.walkToSeat(player, seat);
      const seatTable = this.floor.table(seat.tableId);
      return seatTable ? this.walkToTable(player, seatTable) : rejected('That seat is taken');
    }
    if (this.floor.tileAt(target) === 'counter') {
      return this.walkToNearest(player, this.floor.shopTiles);
    }
    if (this.floor.isWalkable(target)) return this.walkTo(player, target);
    return rejected("You can't walk there");
  }

  step(player: Player, direction: Direction): CommandResult {
    const target = step(player.pos, direction);
    const seat = this.floor.seatAt(target);
    if (seat) {
      return this.seating.isAvailableTo(seat.id, player.id)
        ? this.walkToSeat(player, seat)
        : rejected('That seat is taken');
    }
    if (!this.floor.isWalkable(target)) return rejected('Something is in the way');
    this.standUp(player);
    player.path = [target];
    return OK;
  }

  leaveSeat(player: Player): CommandResult {
    if (player.seatId === null) return rejected('You are not seated');
    const exit = neighbors(player.pos).find((pos) => this.floor.isWalkable(pos));
    this.standUp(player);
    player.path = exit ? [exit] : [];
    return OK;
  }

  private walkToTable(player: Player, table: Table): CommandResult {
    const seats = this.seating
      .availableSeats(table, player.id)
      .sort((a, b) => manhattan(player.pos, a.pos) - manhattan(player.pos, b.pos));
    for (const seat of seats) {
      if (this.walkToSeat(player, seat).ok) return OK;
    }
    return rejected('That table is full');
  }

  private walkToSeat(player: Player, seat: Seat): CommandResult {
    if (player.seated && player.seatId === seat.id) return OK;
    const path = this.findPath(player.pos, seat.pos);
    if (!path) return rejected('No way to reach that seat');
    this.standUp(player);
    this.seating.claim(seat.id, player.id);
    player.seatId = seat.id;
    player.path = path;
    player.seated = path.length === 0;
    return OK;
  }

  private walkToNearest(player: Player, targets: readonly GridPos[]): CommandResult {
    const sorted = [...targets].sort((a, b) => manhattan(player.pos, a) - manhattan(player.pos, b));
    for (const target of sorted) {
      if (this.walkTo(player, target).ok) return OK;
    }
    return rejected('No way to get there');
  }

  private walkTo(player: Player, target: GridPos): CommandResult {
    const path = this.findPath(player.pos, target);
    if (!path) return rejected('No way to get there');
    this.standUp(player);
    player.path = path;
    return OK;
  }

  /** Seats are passable only as the destination, so nobody walks through a seated player. */
  private findPath(from: GridPos, to: GridPos): GridPos[] | null {
    const grid = { isPassable: (pos: GridPos) => this.floor.isWalkable(pos) || samePos(pos, to) };
    return this.pathfinder.findPath(grid, from, to);
  }

  private standUp(player: Player): void {
    this.seating.release(player.id);
    player.seatId = null;
    player.seated = false;
  }
}
