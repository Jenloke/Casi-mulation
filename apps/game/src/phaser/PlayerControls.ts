import type { Direction } from '@casino/contracts';
import * as Phaser from 'phaser';
import type { GameBus } from '../bus/gameBus.ts';
import { tileAt } from './layout.ts';

/** How often a held arrow key repeats its step command. */
const STEP_REPEAT_MS = 160;
const ARROW_KEYS: Readonly<Record<Direction, number>> = {
  up: Phaser.Input.Keyboard.KeyCodes.UP,
  down: Phaser.Input.Keyboard.KeyCodes.DOWN,
  left: Phaser.Input.Keyboard.KeyCodes.LEFT,
  right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
};

/** Clicks become moveTo commands and arrow keys become steps; muted while auto-play drives. */
export class PlayerControls {
  private readonly bus: GameBus;
  private readonly keys: [Direction, Phaser.Input.Keyboard.Key][] = [];
  private enabled = true;
  private nextStepAt = 0;

  constructor(scene: Phaser.Scene, bus: GameBus) {
    this.bus = bus;
    const keyboard = scene.input.keyboard;
    if (keyboard) {
      for (const [direction, code] of Object.entries(ARROW_KEYS) as [Direction, number][]) {
        // No key capture, so arrow keys keep working inside the HUD's inputs.
        this.keys.push([direction, keyboard.addKey(code, false)]);
      }
    }
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (!this.enabled) return;
      this.bus.emit('command', { type: 'moveTo', target: tileAt(pointer.worldX, pointer.worldY) });
    });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  update(time: number): void {
    if (!this.enabled || time < this.nextStepAt || isTypingInHud()) return;
    const pressed = this.keys.find(([, key]) => key.isDown);
    if (!pressed) return;
    this.nextStepAt = time + STEP_REPEAT_MS;
    this.bus.emit('command', { type: 'step', direction: pressed[0] });
  }
}

function isTypingInHud(): boolean {
  const focused = document.activeElement;
  return focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement;
}
