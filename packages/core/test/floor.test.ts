import type { GridPos } from '@casino/contracts';
import { describe, expect, it } from 'vitest';
import { CASINO_FLOOR } from '../src/floor/casinoFloor.ts';
import { FloorMapParser } from '../src/floor/FloorMapParser.ts';
import { AStarPathfinder, type PathGrid } from '../src/grid/AStarPathfinder.ts';
import { samePos } from '../src/grid/gridMath.ts';

const parser = new FloorMapParser();
const pathfinder = new AStarPathfinder();

describe('casino floor', () => {
  const floor = parser.parse(CASINO_FLOOR);

  it('has tables in the middle, a shop and an entrance', () => {
    const count = (gameId: string) => floor.tables.filter((t) => t.gameId === gameId).length;
    expect([floor.width, floor.height]).toEqual([30, 19]);
    const games = ['slots', 'roulette', 'blackjack', 'baccarat'];
    expect(games.map(count)).toEqual([8, 2, 2, 2]);
    expect(floor.shopTiles).toHaveLength(5);
    expect(floor.entrances).toHaveLength(2);
  });

  it('lets a guest reach every seat from the entrance', () => {
    const [entrance] = floor.entrances;
    if (!entrance) throw new Error('no entrance');
    for (const seat of floor.tables.flatMap((table) => table.seats)) {
      const grid = {
        isPassable: (pos: GridPos) => floor.isWalkable(pos) || samePos(pos, seat.pos),
      };
      expect(pathfinder.findPath(grid, entrance, seat.pos), seat.id).not.toBeNull();
    }
  });
});

describe('FloorMapParser', () => {
  const plan = (...rows: string[]) => ({ tableGlyphs: { R: 'roulette', B: 'blackjack' }, rows });

  it('rejects ragged rows and unknown glyphs', () => {
    expect(() => parser.parse(plan('###', '##'))).toThrow(/wide/);
    expect(() => parser.parse(plan('#?#'))).toThrow(/Unknown/);
  });

  it('requires each seat to touch exactly one table', () => {
    expect(() => parser.parse(plan('#####', '#RoB#', '#cE.#', '#####'))).toThrow(/exactly one/);
  });

  it('requires every table to have a seat', () => {
    expect(() => parser.parse(plan('#####', '#R.c#', '#..E#', '#####'))).toThrow(/no seats/);
  });
});

describe('AStarPathfinder', () => {
  const grid = (rows: readonly string[]): PathGrid => ({
    isPassable: ({ x, y }) => rows[y]?.[x] === '.',
  });

  it('walks around walls along a shortest path', () => {
    const path = pathfinder.findPath(
      grid(['.....', '.###.', '.....']),
      { x: 0, y: 1 },
      { x: 4, y: 1 },
    );
    expect(path).toHaveLength(6);
    expect(path?.at(-1)).toEqual({ x: 4, y: 1 });
  });

  it('only steps between orthogonal neighbours', () => {
    const path = pathfinder.findPath(grid(['...', '...', '...']), { x: 0, y: 0 }, { x: 2, y: 2 });
    let previous: GridPos = { x: 0, y: 0 };
    for (const pos of path ?? []) {
      expect(Math.abs(pos.x - previous.x) + Math.abs(pos.y - previous.y)).toBe(1);
      previous = pos;
    }
    expect(path).toHaveLength(4);
  });

  it('returns [] when already there and null when walled off', () => {
    expect(pathfinder.findPath(grid(['..']), { x: 0, y: 0 }, { x: 0, y: 0 })).toEqual([]);
    expect(pathfinder.findPath(grid(['.#.']), { x: 0, y: 0 }, { x: 2, y: 0 })).toBeNull();
  });
});
