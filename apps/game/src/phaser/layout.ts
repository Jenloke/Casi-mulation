import type { GridPos } from '@casino/contracts';

export const TILE = 32;
/** How long one tile step takes at 1x, for smoothing movement between snapshots. */
export const STEP_MS = 200;
export const CAMERA_ZOOM = 1.5;

export function tileCenter(pos: GridPos): { x: number; y: number } {
  return { x: pos.x * TILE + TILE / 2, y: pos.y * TILE + TILE / 2 };
}

export function tileAt(worldX: number, worldY: number): GridPos {
  return { x: Math.floor(worldX / TILE), y: Math.floor(worldY / TILE) };
}

/** '#4f8cff' -> 0x4f8cff */
export function hexColor(hex: string): number {
  return Number.parseInt(hex.replace('#', ''), 16);
}
