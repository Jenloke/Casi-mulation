import type { ItemEffectDto } from '@casino/contracts';
import { ChartCard } from '../components/ChartCard.tsx';
import { Legend } from '../components/Legend.tsx';
import { Tooltip, useHoverTip } from '../components/Tooltip.tsx';
import { useMeasuredWidth } from '../components/useMeasuredWidth.ts';
import { formatCount, formatPercent } from '../format.ts';
import { colorOf, type GameSeries, nameOf } from '../theme.ts';
import { linear } from './geometry.ts';

const ROW = 34;
const AXIS = 24;
const LABEL_WIDTH = 84;
const VALUE_WIDTH = 150;

interface Props {
  readonly effects: readonly ItemEffectDto[];
  readonly series: readonly GameSeries[];
}

/** Dumbbell per game: win rate without an item (ring) joined to win rate with one (dot). */
export function ItemEffectChart({ effects, series }: Props) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>();
  const hover = useHoverTip(ref);
  const rates = effects.flatMap((e) => [e.withItem.winRate ?? 0, e.withoutItem.winRate ?? 0]);
  const hi = Math.min(1, Math.ceil(Math.max(0.1, ...rates) * 10) / 10 + 0.1);
  const plotRight = Math.max(LABEL_WIDTH + 1, width - VALUE_WIDTH);
  const x = linear([0, hi], [LABEL_WIDTH + 8, plotRight]);
  const rowsHeight = effects.length * ROW;
  const table = {
    columns: [
      'Game',
      'Win rate with item',
      'Rounds with item',
      'Win rate without',
      'Rounds without',
    ],
    rows: effects.map((e) => [
      nameOf(series, e.gameId),
      formatPercent(e.withItem.winRate),
      formatCount(e.withItem.rounds),
      formatPercent(e.withoutItem.winRate),
      formatCount(e.withoutItem.rounds),
    ]),
  };
  const legend = (
    <Legend
      items={[
        { label: 'Without item', color: 'var(--muted-foreground)', swatch: 'ring' },
        { label: 'With item', color: 'var(--muted-foreground)', swatch: 'dot' },
      ]}
    />
  );

  return (
    <ChartCard
      title="Item effect on win rate"
      subtitle="Rounds won, with and without an active item"
      table={table}
      legend={legend}
    >
      <div ref={ref} className="relative w-full" onPointerLeave={hover.hide}>
        {width > 0 && (
          <svg className="block overflow-visible" width={width} height={rowsHeight + AXIS}>
            <title>Win rate with and without items per game</title>
            {[0, hi / 2, hi].map((tick) => (
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
            {effects.map((effect, index) => {
              const y = index * ROW + ROW / 2;
              const color = colorOf(series, effect.gameId);
              const name = nameOf(series, effect.gameId);
              const without = effect.withoutItem.winRate;
              const withItem = effect.withItem.winRate;
              const lift =
                withItem !== null && without !== null ? (withItem - without) * 100 : null;
              return (
                <g
                  key={effect.gameId}
                  onPointerMove={(event) =>
                    hover.show(event, name, [
                      {
                        label: `with item (${formatCount(effect.withItem.rounds)} rounds)`,
                        value: formatPercent(withItem),
                        color,
                      },
                      {
                        label: `without (${formatCount(effect.withoutItem.rounds)} rounds)`,
                        value: formatPercent(without),
                      },
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
                    {name}
                  </text>
                  <line x1={x(0)} x2={plotRight} y1={y} y2={y} className="stroke-chart-grid" />
                  {without !== null && withItem !== null && (
                    <line
                      x1={x(without)}
                      x2={x(withItem)}
                      y1={y}
                      y2={y}
                      stroke={color}
                      strokeWidth={2}
                    />
                  )}
                  {without !== null && (
                    <circle
                      cx={x(without)}
                      cy={y}
                      r={5}
                      className="fill-card stroke-muted-foreground stroke-2"
                    />
                  )}
                  {withItem !== null && (
                    <circle
                      cx={x(withItem)}
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
                    {lift === null
                      ? 'no item rounds yet'
                      : `${lift >= 0 ? '+' : ''}${lift.toFixed(1)} pts with item`}
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
