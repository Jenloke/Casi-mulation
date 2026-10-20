import type { FloorDto, GridPos, TableDto, TileKind } from '@casino/contracts';
import type * as Phaser from 'phaser';
import { TILE, tileCenter } from './layout.ts';

const TILE_COLORS: Readonly<Record<TileKind, number>> = {
  wall: 0x161a24,
  floor: 0x3b1f2e,
  table: 0x444b5c,
  seat: 0x3b1f2e,
  counter: 0xb8892c,
  shop: 0x5a4320,
  entrance: 0x2e7d4f,
};
const GAME_COLORS: Readonly<Record<string, number>> = {
  slots: 0x2f5fd0,
  roulette: 0x9b1d30,
  blackjack: 0x1f7a3f,
};
const SEAT_COLOR = 0xd4a937;
const LABEL_STYLE = { fontFamily: 'system-ui, sans-serif', fontSize: '10px', color: '#f4f1e8' };

/** Draws the static floor: tiles, tables, seats and labels. Placeholder shapes only. */
export class FloorRenderer {
  private readonly scene: Phaser.Scene;
  private readonly drawn: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  draw(floor: FloorDto): void {
    this.clear();
    const graphics = this.scene.add.graphics();
    this.drawn.push(graphics);
    floor.tiles.forEach((kind, index) => {
      const x = (index % floor.width) * TILE;
      const y = Math.floor(index / floor.width) * TILE;
      graphics.fillStyle(TILE_COLORS[kind], 1).fillRect(x, y, TILE, TILE);
      if (kind !== 'wall') graphics.lineStyle(1, 0x000000, 0.2).strokeRect(x, y, TILE, TILE);
    });
    for (const table of floor.tables) this.drawTable(graphics, table);
    this.labelTiles(floor, 'counter', 'SHOP');
    this.labelTiles(floor, 'entrance', 'ENTRANCE');
  }

  clear(): void {
    for (const object of this.drawn) object.destroy();
    this.drawn.length = 0;
  }

  private drawTable(graphics: Phaser.GameObjects.Graphics, table: TableDto): void {
    graphics.fillStyle(GAME_COLORS[table.gameId] ?? 0x555555, 1);
    for (const tile of table.tiles) {
      graphics.fillRoundedRect(tile.x * TILE + 2, tile.y * TILE + 2, TILE - 4, TILE - 4, 5);
    }
    graphics.fillStyle(SEAT_COLOR, 1);
    for (const seat of table.seats) {
      const { x, y } = tileCenter(seat.pos);
      graphics.fillCircle(x, y, TILE / 5);
    }
    const label = table.tiles.length === 1 ? table.label.slice(0, 4).toUpperCase() : table.label;
    this.addLabel(this.centerOf(table.tiles), label);
  }

  private labelTiles(floor: FloorDto, kind: TileKind, text: string): void {
    const tiles: GridPos[] = [];
    floor.tiles.forEach((tile, index) => {
      if (tile === kind) tiles.push({ x: index % floor.width, y: Math.floor(index / floor.width) });
    });
    if (tiles.length > 0) this.addLabel(this.centerOf(tiles), text);
  }

  private addLabel(at: { x: number; y: number }, text: string): void {
    this.drawn.push(this.scene.add.text(at.x, at.y, text, LABEL_STYLE).setOrigin(0.5).setDepth(1));
  }

  private centerOf(tiles: readonly GridPos[]): { x: number; y: number } {
    const centers = tiles.map(tileCenter);
    const average = (values: number[]) =>
      values.reduce((sum, value) => sum + value, 0) / values.length;
    return { x: average(centers.map((c) => c.x)), y: average(centers.map((c) => c.y)) };
  }
}
