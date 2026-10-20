/** Sequential ids per prefix ('bot-1', 'round-7'), deterministic across runs. */
export class IdGenerator {
  private readonly counters = new Map<string, number>();

  next(prefix: string): string {
    const count = (this.counters.get(prefix) ?? 0) + 1;
    this.counters.set(prefix, count);
    return `${prefix}-${count}`;
  }
}
