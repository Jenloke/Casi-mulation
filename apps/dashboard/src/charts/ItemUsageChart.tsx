import type { ItemUsageDto } from '@casino/contracts';
import { ChartCard } from '../components/ChartCard.tsx';
import { Legend } from '../components/Legend.tsx';
import { Tooltip, useHoverTip } from '../components/Tooltip.tsx';
import { useMeasuredWidth } from '../components/useMeasuredWidth.ts';
import { formatCount } from '../format.ts';
import { colorOf, type GameSeries, nameOf } from '../theme.ts';
import { hBarPath, linear, niceCeil } from './geometry.ts';

const BAR = 12;
const ROW = 28;
const LABEL_WIDTH = 120;
const VALUE_WIDTH = 120;

interface Props {
  readonly usage: readonly ItemUsageDto[];
  readonly series: readonly GameSeries[];
}

/** Uses per item, each bar in the color of the game the item helps with. */
export function ItemUsageChart({ usage, series }: Props) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>();
  const hover = useHoverTip(ref);
  const max = niceCeil(Math.max(0, ...usage.map((item) => item.uses)));
  const x = linear([0, max], [LABEL_WIDTH, Math.max(LABEL_WIDTH + 1, width - VALUE_WIDTH)]);
  const gamesWithItems = series.filter((s) => usage.some((item) => item.gameId === s.id));
  const table = {
    columns: ['Item', 'Game', 'Bought', 'Uses'],
    rows: usage.map((item) => [
      item.name,
      nameOf(series, item.gameId),
      formatCount(item.purchases),
      formatCount(item.uses),
    ]),
  };

  return (
    <ChartCard
      title="Item usage"
      subtitle="Rounds played with each shop item"
      table={table}
      legend={<Legend items={gamesWithItems.map((s) => ({ label: s.name, color: s.color }))} />}
    >
      <div ref={ref} className="relative w-full" onPointerLeave={hover.hide}>
        {width > 0 && (
          <svg className="block overflow-visible" width={width} height={usage.length * ROW}>
            <title>Uses per shop item</title>
            {usage.map((item, index) => {
              const y = index * ROW + (ROW - BAR) / 2;
              const color = colorOf(series, item.gameId);
              return (
                <g
                  key={item.itemId}
                  onPointerMove={(event) =>
                    hover.show(event, item.name, [
                      { label: 'uses', value: formatCount(item.uses), color },
                      { label: 'bought', value: formatCount(item.purchases) },
                    ])
                  }
                >
                  <rect x={0} y={index * ROW} width={width} height={ROW} fill="transparent" />
                  <text
                    x={0}
                    y={y + BAR / 2}
                    className="fill-muted-foreground text-xs"
                    dominantBaseline="middle"
                  >
                    {item.name}
                  </text>
                  <path d={hBarPath(x(0), y, x(item.uses) - x(0), BAR)} fill={color} />
                  <text
                    x={x(item.uses) + 6}
                    y={y + BAR / 2}
                    className="fill-muted-foreground text-[11px]"
                    dominantBaseline="middle"
                  >
                    {`${formatCount(item.uses)} uses · ${formatCount(item.purchases)} bought`}
                  </text>
                </g>
              );
            })}
            <line
              x1={x(0)}
              x2={x(0)}
              y1={0}
              y2={usage.length * ROW}
              className="stroke-chart-axis"
            />
          </svg>
        )}
        <Tooltip content={hover.tip} chartWidth={width} />
      </div>
    </ChartCard>
  );
}
