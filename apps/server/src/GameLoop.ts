import { type CasinoWorld, TICK_MS } from '@casino/core';

/** Runs the world in real time: every TICK_MS it advances `simSpeed` ticks, then publishes. */
export class GameLoop {
  private readonly world: CasinoWorld;
  private readonly afterTick: () => void;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(world: CasinoWorld, afterTick: () => void) {
    this.world = world;
    this.afterTick = afterTick;
  }

  start(): void {
    this.timer ??= setInterval(() => this.step(), TICK_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** One real-time beat. Public so tests can drive the loop without timers. */
  step(): void {
    const ticks = this.world.simSpeed;
    for (let tick = 0; tick < ticks; tick++) this.world.advance();
    this.afterTick();
  }
}
