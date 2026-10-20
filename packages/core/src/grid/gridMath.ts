import type { Direction, GridPos } from '@casino/contracts';

export const DIRECTIONS: readonly Direction[] = ['up', 'down', 'left', 'right'];

const DELTAS: Readonly<Record<Direction, GridPos>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** The tile one step away in `direction`. */
export function step(pos: GridPos, direction: Direction): GridPos {
  const delta = DELTAS[direction];
  return { x: pos.x + delta.x, y: pos.y + delta.y };
}

/** The four orthogonal neighbours. */
export function neighbors(pos: GridPos): GridPos[] {
  return DIRECTIONS.map((direction) => step(pos, direction));
}

export function samePos(a: GridPos, b: GridPos): boolean {
  return a.x === b.x && a.y === b.y;
}

export function posKey(pos: GridPos): string {
  return `${pos.x},${pos.y}`;
}

export function manhattan(a: GridPos, b: GridPos): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** The closest of `candidates` by walking distance ignoring obstacles. */
export function nearest(from: GridPos, candidates: readonly GridPos[]): GridPos | undefined {
  let best: GridPos | undefined;
  for (const candidate of candidates) {
    if (!best || manhattan(from, candidate) < manhattan(from, best)) best = candidate;
  }
  return best;
}
