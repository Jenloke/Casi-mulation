/**
 * Source of randomness. Every core class that needs chance receives one, so a seed
 * reproduces a whole session. Core code never reaches for a global random source.
 */
export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [0, maxExclusive). */
  int(maxExclusive: number): number;
  /** True with probability `p`. */
  chance(p: number): boolean;
  /** Uniform pick from a non-empty list. */
  pick<T>(items: readonly T[]): T;
  /** Independent generator derived from this one, e.g. one per bot. */
  fork(): Rng;
}
