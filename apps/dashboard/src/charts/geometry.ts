/** Maps a domain linearly onto a pixel range. */
export function linear(
  domain: readonly [number, number],
  range: readonly [number, number],
): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (value) => r0 + ((value - d0) / span) * (r1 - r0);
}

/** The next clean axis maximum (1, 2 or 5 x 10^n) at or above `value`. */
export function niceCeil(value: number): number {
  if (!(value > 0)) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((candidate) => value <= candidate * magnitude) ?? 10;
  return step * magnitude;
}

/** A horizontal bar growing from x0: square at the baseline, 4px rounded data end. */
export function hBarPath(x0: number, y: number, length: number, thickness: number): string {
  if (!(length > 0)) return '';
  const r = Math.min(4, length, thickness / 2);
  return [
    `M${x0},${y}`,
    `h${length - r}`,
    `a${r},${r} 0 0 1 ${r},${r}`,
    `v${thickness - 2 * r}`,
    `a${r},${r} 0 0 1 ${-r},${r}`,
    `h${r - length}`,
    'Z',
  ].join('');
}
