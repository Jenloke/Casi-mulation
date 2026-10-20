import type { GridPos } from '@casino/contracts';
import { manhattan, neighbors, posKey, samePos } from './gridMath.ts';
import { MinHeap } from './MinHeap.ts';

/** The grid as A* sees it. */
export interface PathGrid {
  /** True when a walker may enter this tile; must be false outside the grid. */
  isPassable(pos: GridPos): boolean;
}

/** Four-directional A* with a Manhattan heuristic. */
export class AStarPathfinder {
  /**
   * Tiles to walk from `start` (exclusive) to `goal` (inclusive).
   * Returns [] when already there and null when the goal can't be reached.
   */
  findPath(grid: PathGrid, start: GridPos, goal: GridPos): GridPos[] | null {
    if (samePos(start, goal)) return [];
    if (!grid.isPassable(goal)) return null;

    const open = new MinHeap<GridPos>();
    const cameFrom = new Map<string, GridPos>();
    const cost = new Map<string, number>([[posKey(start), 0]]);
    const closed = new Set<string>();
    open.push(start, manhattan(start, goal));

    for (let current = open.pop(); current !== undefined; current = open.pop()) {
      if (samePos(current, goal)) return this.reconstruct(cameFrom, current);
      const key = posKey(current);
      if (closed.has(key)) continue;
      closed.add(key);
      const nextCost = (cost.get(key) ?? 0) + 1;
      for (const next of neighbors(current)) {
        const nextKey = posKey(next);
        if (closed.has(nextKey) || !grid.isPassable(next)) continue;
        if (nextCost >= (cost.get(nextKey) ?? Number.POSITIVE_INFINITY)) continue;
        cost.set(nextKey, nextCost);
        cameFrom.set(nextKey, current);
        open.push(next, nextCost + manhattan(next, goal));
      }
    }
    return null;
  }

  private reconstruct(cameFrom: ReadonlyMap<string, GridPos>, goal: GridPos): GridPos[] {
    const path: GridPos[] = [];
    for (let node: GridPos | undefined = goal; node; node = cameFrom.get(posKey(node))) {
      path.push(node);
    }
    path.pop(); // the start tile
    return path.reverse();
  }
}
