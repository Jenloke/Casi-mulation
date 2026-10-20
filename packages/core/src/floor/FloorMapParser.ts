import type { GameId, GridPos, TileKind } from '@casino/contracts';
import { neighbors, posKey } from '../grid/gridMath.ts';
import { FloorMap, type Seat, type Table } from './FloorMap.ts';

/**
 * An ASCII floor plan. Fixed glyphs: `#` wall, `.` floor, `E` entrance, `$` shop counter,
 * `c` shop tile (stand here to shop), `o` seat. Table glyphs come from `tableGlyphs`.
 */
export interface FloorDefinition {
  /** Glyph -> game played at tables drawn with it, e.g. `{ R: 'roulette' }`. */
  readonly tableGlyphs: Readonly<Record<string, GameId>>;
  readonly rows: readonly string[];
}

const FIXED_GLYPHS: Readonly<Record<string, TileKind>> = {
  '#': 'wall',
  '.': 'floor',
  E: 'entrance',
  $: 'counter',
  c: 'shop',
  o: 'seat',
};

interface TableRun {
  readonly gameId: GameId;
  readonly tiles: GridPos[];
}

interface Glyphs {
  readonly width: number;
  readonly height: number;
  at(pos: GridPos): string;
}

/**
 * Turns an ASCII plan into a FloorMap. A connected run of one table glyph is one table,
 * and every seat must touch exactly one table.
 */
export class FloorMapParser {
  parse(definition: FloorDefinition): FloorMap {
    for (const glyph of Object.keys(definition.tableGlyphs)) {
      if (Object.hasOwn(FIXED_GLYPHS, glyph)) throw new Error(`Table glyph '${glyph}' is reserved`);
    }
    const glyphs = this.readGlyphs(definition.rows);
    const tiles: TileKind[] = [];
    for (const row of definition.rows) {
      for (const glyph of row) tiles.push(this.tileKind(glyph, definition.tableGlyphs));
    }
    const runAt = new Map<string, number>();
    const runs = this.findTableRuns(glyphs, definition.tableGlyphs, runAt);
    const tables = this.buildTables(runs, this.findSeats(glyphs, runs, runAt));
    const floor = new FloorMap({ width: glyphs.width, height: glyphs.height, tiles, tables });
    if (floor.entrances.length === 0) throw new Error('The floor plan needs an entrance (E)');
    if (floor.shopTiles.length === 0) throw new Error('The floor plan needs a shop tile (c)');
    return floor;
  }

  private readGlyphs(rows: readonly string[]): Glyphs {
    const width = rows[0]?.length ?? 0;
    if (width === 0) throw new Error('The floor plan is empty');
    rows.forEach((row, y) => {
      if (row.length !== width) {
        throw new Error(`Floor row ${y} is ${row.length} tiles wide, expected ${width}`);
      }
    });
    return { width, height: rows.length, at: (pos) => rows[pos.y]?.[pos.x] ?? '#' };
  }

  private tileKind(glyph: string, tableGlyphs: FloorDefinition['tableGlyphs']): TileKind {
    const fixed = FIXED_GLYPHS[glyph];
    if (fixed) return fixed;
    if (Object.hasOwn(tableGlyphs, glyph)) return 'table';
    throw new Error(`Unknown floor glyph '${glyph}'`);
  }

  /** Flood-fills connected runs of each table glyph; `runAt` maps tile keys to run indexes. */
  private findTableRuns(
    glyphs: Glyphs,
    tableGlyphs: FloorDefinition['tableGlyphs'],
    runAt: Map<string, number>,
  ): TableRun[] {
    const runs: TableRun[] = [];
    for (const start of this.positions(glyphs)) {
      const glyph = glyphs.at(start);
      const gameId = Object.hasOwn(tableGlyphs, glyph) ? tableGlyphs[glyph] : undefined;
      if (gameId === undefined || runAt.has(posKey(start))) continue;
      const index = runs.length;
      const tiles: GridPos[] = [];
      const stack = [start];
      runAt.set(posKey(start), index);
      for (let pos = stack.pop(); pos !== undefined; pos = stack.pop()) {
        tiles.push(pos);
        for (const next of neighbors(pos)) {
          if (glyphs.at(next) !== glyph || runAt.has(posKey(next))) continue;
          runAt.set(posKey(next), index);
          stack.push(next);
        }
      }
      tiles.sort((a, b) => a.y - b.y || a.x - b.x);
      runs.push({ gameId, tiles });
    }
    return runs;
  }

  /** Seat positions per table run, in reading order. */
  private findSeats(
    glyphs: Glyphs,
    runs: readonly TableRun[],
    runAt: ReadonlyMap<string, number>,
  ): GridPos[][] {
    const seats = runs.map((): GridPos[] => []);
    for (const pos of this.positions(glyphs)) {
      if (glyphs.at(pos) !== 'o') continue;
      const touching = new Set<number>();
      for (const next of neighbors(pos)) {
        const run = runAt.get(posKey(next));
        if (run !== undefined) touching.add(run);
      }
      const [run] = touching;
      if (touching.size !== 1 || run === undefined) {
        throw new Error(
          `Seat at ${pos.x},${pos.y} must touch exactly one table, touches ${touching.size}`,
        );
      }
      seats[run]?.push(pos);
    }
    return seats;
  }

  private buildTables(runs: readonly TableRun[], seatsByRun: readonly GridPos[][]): Table[] {
    const countByGame = new Map<GameId, number>();
    return runs.map((run, index) => {
      const number = (countByGame.get(run.gameId) ?? 0) + 1;
      countByGame.set(run.gameId, number);
      const id = `${run.gameId}-${number}`;
      const seats: Seat[] = (seatsByRun[index] ?? []).map((pos, seatIndex) => ({
        id: `${id}/seat-${seatIndex + 1}`,
        tableId: id,
        pos,
      }));
      if (seats.length === 0) throw new Error(`Table ${id} has no seats`);
      return { id, gameId: run.gameId, number, tiles: run.tiles, seats };
    });
  }

  private positions(glyphs: Glyphs): GridPos[] {
    const positions: GridPos[] = [];
    for (let y = 0; y < glyphs.height; y++) {
      for (let x = 0; x < glyphs.width; x++) positions.push({ x, y });
    }
    return positions;
  }
}
