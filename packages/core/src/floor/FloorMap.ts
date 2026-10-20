import type { GameId, GridPos, TileKind } from '@casino/contracts';
import { posKey } from '../grid/gridMath.ts';

export interface Seat {
  readonly id: string;
  readonly tableId: string;
  readonly pos: GridPos;
}

export interface Table {
  readonly id: string;
  readonly gameId: GameId;
  /** 1-based number among tables of the same game, for labels. */
  readonly number: number;
  readonly tiles: readonly GridPos[];
  readonly seats: readonly Seat[];
}

export interface FloorLayout {
  readonly width: number;
  readonly height: number;
  /** Row-major tile kinds, `width * height` long. */
  readonly tiles: readonly TileKind[];
  readonly tables: readonly Table[];
}

const WALKABLE: ReadonlySet<TileKind> = new Set<TileKind>(['floor', 'shop', 'entrance']);

/** The parsed casino floor, with lookups for tables, seats, the shop and the entrance. */
export class FloorMap {
  readonly width: number;
  readonly height: number;
  readonly tiles: readonly TileKind[];
  readonly tables: readonly Table[];
  readonly entrances: readonly GridPos[];
  readonly shopTiles: readonly GridPos[];
  /** Every tile anyone may walk through. */
  readonly walkableTiles: readonly GridPos[];
  private readonly tableByTile = new Map<string, Table>();
  private readonly tableById = new Map<string, Table>();
  private readonly seatByTile = new Map<string, Seat>();
  private readonly seatById = new Map<string, Seat>();

  constructor(layout: FloorLayout) {
    this.width = layout.width;
    this.height = layout.height;
    this.tiles = layout.tiles;
    this.tables = layout.tables;
    for (const table of layout.tables) {
      this.tableById.set(table.id, table);
      for (const tile of table.tiles) this.tableByTile.set(posKey(tile), table);
      for (const seat of table.seats) {
        this.seatByTile.set(posKey(seat.pos), seat);
        this.seatById.set(seat.id, seat);
      }
    }
    const positions = this.allPositions();
    this.entrances = positions.filter((pos) => this.tileAt(pos) === 'entrance');
    this.shopTiles = positions.filter((pos) => this.tileAt(pos) === 'shop');
    this.walkableTiles = positions.filter((pos) => this.isWalkable(pos));
  }

  inBounds(pos: GridPos): boolean {
    return pos.x >= 0 && pos.y >= 0 && pos.x < this.width && pos.y < this.height;
  }

  tileAt(pos: GridPos): TileKind {
    if (!this.inBounds(pos)) return 'wall';
    return this.tiles[pos.y * this.width + pos.x] ?? 'wall';
  }

  /** Open floor anyone may walk through. Seats are only ever entered as a destination. */
  isWalkable(pos: GridPos): boolean {
    return WALKABLE.has(this.tileAt(pos));
  }

  isShop(pos: GridPos): boolean {
    return this.tileAt(pos) === 'shop';
  }

  isEntrance(pos: GridPos): boolean {
    return this.tileAt(pos) === 'entrance';
  }

  tableAt(pos: GridPos): Table | undefined {
    return this.tableByTile.get(posKey(pos));
  }

  seatAt(pos: GridPos): Seat | undefined {
    return this.seatByTile.get(posKey(pos));
  }

  table(id: string): Table | undefined {
    return this.tableById.get(id);
  }

  seat(id: string): Seat | undefined {
    return this.seatById.get(id);
  }

  private allPositions(): GridPos[] {
    const positions: GridPos[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) positions.push({ x, y });
    }
    return positions;
  }
}
