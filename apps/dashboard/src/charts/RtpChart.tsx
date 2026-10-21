import type { GameStatsDto } from '@casino/contracts';
import { ChartCard } from '../components/ChartCard.tsx';
import { Legend } from '../components/Legend.tsx';
import { Tooltip, useHoverTip } from '../components/Tooltip.tsx';
import { useMeasuredWidth } from '../components/useMeasuredWidth.ts';
import { formatCount, formatPercent } from '../format.ts';
import { colorOf, type GameSeries } from '../theme.ts';
import { linear } from './geometry.ts';

const ROW = 34;
const AXIS = 24;
const LABEL_WIDTH = 84;
const VALUE_WIDTH = 132;

interface Props {
  readonly games: readonly GameStatsDto[];
  readonly series: readonly GameSeries[];
}

/** Axis labels closer than this to the 100% label would overlap it. */
const MIN_TICK_GAP = 36;

/** Dumbbell per game: the theoretical RTP tick, joined to the actual RTP dot. */
export function RtpChart({ games, series }: Props) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>();
  const hover = useHoverTip(ref);
  const values = games.flatMap((game) =>
    game.actualRtp === null ? [game.theoreticalRtp] : [game.theoreticalRtp, game.actualRtp],
  );
  const lo = Math.floor(Math.min(0.85, ...values) * 20) / 20;
  const hi = Math.ceil(Math.max(1.05, ...values) * 20) / 20;
  const plotRight = Math.max(LABEL_WIDTH + 1, width - VALUE_WIDTH);
  const x = linear([lo, hi], [LABEL_WIDTH + 8, plotRight]);
  // Break-even (100%) is always labelled; the domain ends only where they don't crowd it.
  const ticks = [lo, 1, hi].filter(
    (tick) => tick === 1 || Math.abs(x(tick) - x(1)) >= MIN_TICK_GAP,
  );
  const rowsHeight = games.length * ROW;
  const table = {
    columns: ['Game', 'Rounds', 'Actual RTP', 'Theoretical RTP'],
    rows: games.map((game) => [
      game.name,
      formatCount(game.rounds),
      formatPercent(game.actualRtp),
      formatPercent(game.theoreticalRtp),
    ]),
  };
  const legend = (
    <Legend
      items={[
        { label: 'Actual', color: 'var(--muted-foreground)', swatch: 'dot' },
        { label: 'Theoretical', color: 'var(--foreground)', swatch: 'tick' },
      ]}
    />
  );

  return (
    <ChartCard
      title="Actual vs theoretical RTP"
      subtitle="Share of wagered chips paid back"
      table={table}
      legend={legend}
    >
      <div ref={ref} className="relative w-full" onPointerLeave={hover.hide}>
        {width > 0 && (
          <svg className="block overflow-visible" width={width} height={rowsHeight + AXIS}>
            <title>Actual versus theoretical return to player per game</title>
            <line x1={x(1)} x2={x(1)} y1={0} y2={rowsHeight} className="stroke-chart-axis" />
            {ticks.map((tick) => (
              <text
                key={tick}
                x={x(tick)}
                y={rowsHeight + 16}
                className="fill-chart-muted text-[11px] tabular-nums"
                textAnchor="middle"
              >
                {formatPercent(tick, 0)}
              </text>
            ))}
            {games.map((game, index) => {
              const y = index * ROW + ROW / 2;
              const color = colorOf(series, game.gameId);
              const actual = game.actualRtp;
              return (
                <g
                  key={game.gameId}
                  onPointerMove={(event) =>
                    hover.show(event, game.name, [
                      { label: 'actual', value: formatPercent(actual), color },
                      { label: 'theoretical', value: formatPercent(game.theoreticalRtp) },
                      { label: 'rounds', value: formatCount(game.rounds) },
                    ])
                  }
                >
                  <rect x={0} y={y - ROW / 2} width={width} height={ROW} fill="transparent" />
                  <text
                    x={0}
                    y={y}
                    className="fill-muted-foreground text-xs"
                    dominantBaseline="middle"
                  >
                    {game.name}
                  </text>
                  <line x1={x(lo)} x2={plotRight} y1={y} y2={y} className="stroke-chart-grid" />
                  {actual !== null && (
                    <line
                      x1={x(game.theoreticalRtp)}
                      x2={x(actual)}
                      y1={y}
                      y2={y}
                      stroke={color}
                      strokeWidth={2}
                    />
                  )}
                  <line
                    x1={x(game.theoreticalRtp)}
                    x2={x(game.theoreticalRtp)}
                    y1={y - 7}
                    y2={y + 7}
                    className="stroke-foreground stroke-2"
                  />
                  {actual !== null && (
                    <circle
                      cx={x(actual)}
                      cy={y}
                      r={5}
                      fill={color}
                      className="stroke-card stroke-2"
                    />
                  )}
                  <text
                    x={plotRight + 12}
                    y={y}
                    className="fill-muted-foreground text-[11px]"
                    dominantBaseline="middle"
                  >
                    {actual === null ? 'no rounds yet' : `${formatPercent(actual)} actual`}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
        <Tooltip content={hover.tip} chartWidth={width} />
      </div>
    </ChartCard>
  );
}
