import * as Phaser from 'phaser';
import type { GameBus } from '../bus/gameBus.ts';
import { FloorScene } from './FloorScene.ts';

export function createPhaserGame(parent: HTMLElement, bus: GameBus): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0b0d12',
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: parent.clientWidth,
      height: parent.clientHeight,
    },
    scene: [new FloorScene(bus)],
  });
}
