import type { GameId, GameStatsDto } from '@casino/contracts';

export interface GameSeries {
  readonly id: GameId;
  readonly name: string;
  readonly color: string;
}

/** The palette has eight categorical slots; games past that fold into the "Other" gray. */
const CATEGORICAL_SLOTS = 8;

/**
 * Each game keeps the categorical slot of its place in the registry, on every chart,
 * so a color always means the same game, never a rank.
 */
export function gameSeries(games: readonly GameStatsDto[]): GameSeries[] {
  return games.map((game, index) => ({
    id: game.gameId,
    name: game.name,
    color: index < CATEGORICAL_SLOTS ? `var(--chart-${index + 1})` : 'var(--chart-deemphasis)',
  }));
}

export function colorOf(series: readonly GameSeries[], gameId: GameId): string {
  return series.find((entry) => entry.id === gameId)?.color ?? 'var(--chart-deemphasis)';
}

export function nameOf(series: readonly GameSeries[], gameId: GameId): string {
  return series.find((entry) => entry.id === gameId)?.name ?? gameId;
}
