import type { GridPos, PlayerDto } from '@casino/contracts';
import type * as Phaser from 'phaser';
import { hexColor, STEP_MS, TILE, tileCenter } from './layout.ts';

const TAG_STYLE = { fontFamily: 'system-ui, sans-serif', fontSize: '9px', color: '#ffffff' };
const LOCAL_RING_COLOR = 0xffe066;

/** One player's marker: a placeholder body, a name tag, and a ring if it is you. */
export class PlayerSprite {
  readonly container: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly tag: Phaser.GameObjects.Text;
  private pos: GridPos;
  private lastRoundId: string | null;

  constructor(scene: Phaser.Scene, player: PlayerDto, isLocal: boolean) {
    this.scene = scene;
    this.pos = player.pos;
    this.lastRoundId = player.lastRound?.id ?? null;
    this.tag = scene.add.text(0, -TILE * 0.6, player.name, TAG_STYLE).setOrigin(0.5);
    const parts: Phaser.GameObjects.GameObject[] = [this.createBody(player), this.tag];
    if (isLocal)
      parts.unshift(scene.add.circle(0, 0, TILE * 0.46).setStrokeStyle(2, LOCAL_RING_COLOR));
    const { x, y } = tileCenter(player.pos);
    this.container = scene.add.container(x, y, parts).setDepth(isLocal ? 3 : 2);
  }

  update(player: PlayerDto, simSpeed: number): void {
    this.tag.setText(player.autoPlay ? `${player.name} (auto)` : player.name);
    this.floatResult(player);
    if (player.pos.x === this.pos.x && player.pos.y === this.pos.y) return;
    this.pos = player.pos;
    const { x, y } = tileCenter(player.pos);
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({ targets: this.container, x, y, duration: STEP_MS / simSpeed });
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.container);
    this.container.destroy();
  }

  private createBody(player: PlayerDto): Phaser.GameObjects.Shape {
    const { bodyColor, outlineColor, shape } = player.appearance;
    const size = TILE * 0.56;
    const body =
      shape === 'circle'
        ? this.scene.add.circle(0, 0, size / 2, hexColor(bodyColor))
        : this.scene.add.rectangle(0, 0, size, size, hexColor(bodyColor));
    if (shape === 'diamond') body.setAngle(45);
    return body.setStrokeStyle(2, hexColor(outlineColor));
  }

  /** Floats "+20" / "-10" above the player whenever a new round of theirs settles. */
  private floatResult(player: PlayerDto): void {
    const last = player.lastRound;
    if (!last || last.id === this.lastRoundId) return;
    this.lastRoundId = last.id;
    if (last.net === 0) return;
    const text = this.scene.add
      .text(
        this.container.x,
        this.container.y - TILE * 0.8,
        `${last.net > 0 ? '+' : ''}${last.net}`,
        {
          ...TAG_STYLE,
          fontSize: '12px',
          color: last.net > 0 ? '#7cfc8a' : '#ff8080',
        },
      )
      .setOrigin(0.5)
      .setDepth(5);
    this.scene.tweens.add({
      targets: text,
      y: text.y - TILE,
      alpha: 0,
      duration: 1_200,
      onComplete: () => text.destroy(),
    });
  }
}
