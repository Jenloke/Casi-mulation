/** A tile coordinate on the casino floor; x grows right, y grows down. */
export interface GridPos {
  readonly x: number;
  readonly y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';
