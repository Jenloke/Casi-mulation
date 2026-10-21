import type { GameStatsDto } from '@casino/contracts';
import { ChartCard } from '../components/ChartCard.tsx';
import { Legend } from '../components/Legend.tsx';
import { Tooltip, useHoverTip } from '../components/Tooltip.tsx';
import { useMeasuredWidth } from '../components/useMeasuredWidth.ts';
import { formatCompact, formatCount } from '../format.ts';
import { colorOf, type GameSeries } from '../theme.ts';
import { hBarPath, linear, niceCeil } from './geometry.ts';

const BAR = 10;
const GAP = 2;
const GROUP_GAP = 18;
const LABEL_WIDTH = 84;
const VALUE_WIDTH = 52;

interface Props {
  readonly games: readonly GameStatsDto[];
  readonly series: readonly GameSeries[];
}

/** Two thin bars per game in the game's color: a tint for wagered, solid for paid out. */
export function WageredPaidChart({ games, series }: Props) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>();
  const hover = useHoverTip(ref);
  const max = niceCeil(Math.max(0, ...games.flatMap((game) => [game.wagered, game.paid])));
  const x = linear([0, max], [LABEL_WIDTH, Math.max(LABEL_WIDTH + 1, width - VALUE_WIDTH)]);
  const groupHeight = BAR * 2 + GAP;
  const height = games.length * (groupHeight + GROUP_GAP);
  const table = {
    columns: ['Game', 'Rounds', 'Wagered', 'Paid out', 'House kept'],
    rows: games.map((game) => [
      game.name,
      formatCount(game.rounds),
      formatCount(game.wagered),
      formatCount(game.paid),
      formatCount(game.wagered - game.paid),
    ]),
  };
  const legend = (
    <Legend
      items={[
        { label: 'Wagered', color: 'var(--muted-foreground)', swatch: 'tint' },
        { label: 'Paid out', color: 'var(--muted-foreground)', swatch: 'rect' },
      ]}
    />
  );

  return (
    <ChartCard
      title="Chips wagered and paid out"
      subtitle="Per game, since the server started"
      table={table}
      legend={legend}
    >
      <div ref={ref} className="relative w-full" onPointerLeave={hover.hide}>
        {width > 0 && (
          <svg className="block overflow-visible" width={width} height={height}>
            <title>Chips wagered and paid out per game</title>
            {games.map((game, index) => {
              const top = GROUP_GAP / 2 + index * (groupHeight + GROUP_GAP);
              const color = colorOf(series, game.gameId);
              const bars = [
                { label: 'Wagered', value: game.wagered, y: top, opacity: 0.4 },
                { label: 'Paid out', value: game.paid, y: top + BAR + GAP, opacity: 1 },
              ];
              return (
                <g key={game.gameId}>
                  <text
                    x={0}
                    y={top + groupHeight / 2}
                    className="fill-muted-foreground text-xs"
                    dominantBaseline="middle"
                  >
                    {game.name}
                  </text>
                  {bars.map((bar) => (
                    <g
                      key={bar.label}
                      onPointerMove={(event) =>
                        hover.show(event, game.name, [
                          { label: bar.label, value: `${formatCount(bar.value)} chips`, color },
                        ])
                      }
                    >
                      <rect
                        x={LABEL_WIDTH}
                        y={bar.y - 1}
                        width={Math.max(0, width - LABEL_WIDTH)}
                        height={BAR + GAP}
                        fill="transparent"
                      />
                      <path
                        d={hBarPath(x(0), bar.y, x(bar.value) - x(0), BAR)}
                        fill={color}
                        fillOpacity={bar.opacity}
                      />
                      <text
                        x={x(bar.value) + 6}
                        y={bar.y + BAR / 2}
                        className="fill-muted-foreground text-[11px]"
                        dominantBaseline="middle"
                      >
                        {formatCompact(bar.value)}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}
            <line x1={x(0)} x2={x(0)} y1={0} y2={height} className="stroke-chart-axis" />
          </svg>
        )}
        <Tooltip content={hover.tip} chartWidth={width} />
      </div>
    </ChartCard>
  );
}
