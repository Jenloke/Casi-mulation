import { describe, expect, it } from 'vitest';
import { hBarPath, linear, niceCeil } from './geometry.ts';

describe('chart geometry', () => {
  it('rounds axis maxima up to 1, 2 or 5 x 10^n', () => {
    expect([0, 0.4, 3, 7, 12, 480, 1_001].map(niceCeil)).toEqual([1, 0.5, 5, 10, 20, 500, 2_000]);
  });

  it('maps values linearly', () => {
    const x = linear([0, 10], [100, 200]);
    expect([x(0), x(5), x(10)]).toEqual([100, 150, 200]);
  });

  it('draws nothing for empty bars and rounds only the data end', () => {
    expect(hBarPath(0, 0, 0, 10)).toBe('');
    expect(hBarPath(10, 5, 50, 10)).toBe('M10,5h46a4,4 0 0 1 4,4v2a4,4 0 0 1 -4,4h-46Z');
  });
});
