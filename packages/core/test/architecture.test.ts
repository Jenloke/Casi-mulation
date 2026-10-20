import { describe, expect, it } from 'vitest';

const sources = import.meta.glob<string>('../src/**/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const FORBIDDEN: readonly (readonly [RegExp, string])[] = [
  [/Math\.random/, 'use the injected Rng'],
  [/Date\.now|new Date\(/, 'use the injected Clock'],
  [/from '(node:|react|phaser|fastify|ws)/, 'core stays free of platform and framework imports'],
  [/\b(window|document|localStorage)\./, 'core has no DOM'],
];

describe('core architecture rules', () => {
  it('finds the core sources', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(20);
  });

  it.each(Object.entries(sources))('%s is pure game logic', (_file, source) => {
    for (const [pattern, rule] of FORBIDDEN) expect(source, rule).not.toMatch(pattern);
  });
});
