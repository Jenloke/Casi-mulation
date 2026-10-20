import type { GameId, TimelineBucketDto } from '@casino/contracts';

/** Rounds settled per game in fixed time buckets; only the newest `maxBuckets` are kept. */
export class RoundsTimeline {
  readonly bucketMs: number;
  private readonly maxBuckets: number;
  private readonly buckets = new Map<number, Map<GameId, number>>();

  constructor(bucketMs: number, maxBuckets: number) {
    this.bucketMs = bucketMs;
    this.maxBuckets = maxBuckets;
  }

  add(at: number, gameId: GameId): void {
    const start = this.bucketStart(at);
    const bucket = this.buckets.get(start) ?? new Map<GameId, number>();
    bucket.set(gameId, (bucket.get(gameId) ?? 0) + 1);
    this.buckets.set(start, bucket);
    this.dropBucketsBefore(start - (this.maxBuckets - 1) * this.bucketMs);
  }

  /** The window ending at `now`, oldest first, empty buckets included. */
  window(now: number): TimelineBucketDto[] {
    const last = this.bucketStart(now);
    return Array.from({ length: this.maxBuckets }, (_, index) => {
      const start = last - (this.maxBuckets - 1 - index) * this.bucketMs;
      return { start, roundsByGame: Object.fromEntries(this.buckets.get(start) ?? []) };
    });
  }

  private bucketStart(at: number): number {
    return at - (at % this.bucketMs);
  }

  private dropBucketsBefore(oldest: number): void {
    for (const start of this.buckets.keys()) {
      if (start < oldest) this.buckets.delete(start);
    }
  }
}
