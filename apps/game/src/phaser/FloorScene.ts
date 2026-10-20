import type { FloorDto, StateMessage } from '@casino/contracts';
import * as Phaser from 'phaser';
import type { GameBus } from '../bus/gameBus.ts';
import { FloorRenderer } from './FloorRenderer.ts';
import { CAMERA_ZOOM, TILE } from './layout.ts';
import { PlayerControls } from './PlayerControls.ts';
import { PlayerSprites } from './PlayerSprites.ts';

/** Draws the casino floor and everyone on it, and turns clicks and arrow keys into commands. */
export class FloorScene extends Phaser.Scene {
  private readonly bus: GameBus;
  private floorRenderer: FloorRenderer | null = null;
  private players: PlayerSprites | null = null;
  private controls: PlayerControls | null = null;
  private followed: Phaser.GameObjects.Container | null = null;
  private readonly unsubscribes: (() => void)[] = [];

  constructor(bus: GameBus) {
    super('floor');
    this.bus = bus;
  }

  create(): void {
    this.floorRenderer = new FloorRenderer(this);
    this.players = new PlayerSprites(this);
    this.controls = new PlayerControls(this, this.bus);
    this.unsubscribes.push(
      this.bus.on('net:welcome', (welcome) => this.showFloor(welcome.floor), { replay: true }),
      this.bus.on('net:state', (state) => this.showState(state), { replay: true }),
    );
    // A destroyed game (e.g. React StrictMode remounting) never shuts its scenes down.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribeAll());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.unsubscribeAll());
  }

  private unsubscribeAll(): void {
    for (const unsubscribe of this.unsubscribes.splice(0)) unsubscribe();
  }

  override update(time: number): void {
    this.controls?.update(time);
  }

  private showFloor(floor: FloorDto): void {
    this.floorRenderer?.draw(floor);
    this.players?.clear();
    this.followed = null;
    this.cameras.main.setBounds(0, 0, floor.width * TILE, floor.height * TILE).setZoom(CAMERA_ZOOM);
  }

  private showState(state: StateMessage): void {
    this.players?.sync(state);
    this.controls?.setEnabled(!state.self.autoPlay);
    const local = this.players?.local;
    if (local && local !== this.followed) {
      this.followed = local;
      this.cameras.main.startFollow(local, true, 0.15, 0.15);
    }
  }
}
