/** Wall-clock source (epoch ms), injected so the core stays deterministic in tests. */
export interface Clock {
  now(): number;
}

/** A clock that only moves when told to; for tests and offline simulations. */
export class ManualClock implements Clock {
  private current: number;

  constructor(start = 0) {
    this.current = start;
  }

  now(): number {
    return this.current;
  }

  advance(ms: number): void {
    this.current += ms;
  }
}
