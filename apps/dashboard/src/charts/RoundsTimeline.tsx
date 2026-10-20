import type { AnalyticsSnapshotDto } from '@casino/contracts';
import { type PointerEvent, useState } from 'react';
import { ChartCard } from '../components/ChartCard.tsx';
import { Legend } from '../components/Legend.tsx';
import { Tooltip } from '../components/Tooltip.tsx';
import { useMeasuredWidth } from '../components/useMeasuredWidth.ts';
import { formatClock, formatCount } from '../format.ts';
import type { GameSeries } from '../theme.ts';
import { linear, niceCeil } from './geometry.ts';

const HEIGHT = 220;
const MARGIN = { top: 14, right: 92, bottom: 28, left: 44 };
/** End labels closer than this would collide; the legend and tooltip carry identity then. */
const MIN_LABEL_GAP = 13;

interface Props {
  readonly timeline: AnalyticsSnapshotDto['timeline'];
  readonly series: readonly GameSeries[];
}

/** Rounds settled per time bucket: one 2px line per game, crosshair + tooltip on hover. */
export function RoundsTimeline({ timeline, series }: Props) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { buckets, bucketMs } = timeline;
  const last = Math.max(0, buckets.length - 1);
  const valueAt = (index: number, gameId: string) => buckets[index]?.roundsByGame[gameId] ?? 0;

  const maxY = niceCeil(
    Math.max(1, ...buckets.flatMap((_, i) => series.map((s) => valueAt(i, s.id)))),
  );
  const plotRight = Math.max(MARGIN.left + 1, width - MARGIN.right);
  const x = linear([0, Math.max(1, last)], [MARGIN.left, plotRight]);
  const y = linear([0, maxY], [HEIGHT - MARGIN.bottom, MARGIN.top]);
  const yTicks = maxY % 2 === 0 ? [0, maxY / 2, maxY] : [0, maxY];
  const minutes = Math.round((buckets.length * bucketMs) / 60_000);
  const endLabels = placeEndLabels(series.map((s) => ({ ...s, y: y(valueAt(last, s.id)) })));

  const onPointerMove = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / Math.max(1, box.width);
    setHoverIndex(Math.min(last, Math.max(0, Math.round(ratio * last))));
  };

  const hovered = hoverIndex === null ? undefined : buckets[hoverIndex];
  const table = {
    columns: ['Time', ...series.map((s) => s.name)],
    rows: buckets.map((bucket) => [
      formatClock(bucket.start),
      ...series.map((s) => formatCount(bucket.roundsByGame[s.id] ?? 0)),
    ]),
  };

  return (
    <ChartCard
      wide
      title="Rounds over time"
      subtitle={`Rounds settled per ${bucketMs / 1_000}s, last ${minutes} minutes`}
      table={table}
      legend={
        <Legend items={series.map((s) => ({ label: s.name, color: s.color, swatch: 'line' }))} />
      }
    >
      <div ref={ref} className="chart">
        {width > 0 && (
          <svg width={width} height={HEIGHT}>
            <title>Rounds settled over time, by game</title>
            {yTicks.map((tick) => (
              <g key={tick}>
                <line x1={MARGIN.left} x2={plotRight} y1={y(tick)} y2={y(tick)} className="grid" />
                <text
                  x={MARGIN.left - 8}
                  y={y(tick)}
                  className="tick"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {formatCount(tick)}
                </text>
              </g>
            ))}
            {[0, Math.round(last / 2), last].map((index) => (
              <text key={index} x={x(index)} y={HEIGHT - 8} className="tick" textAnchor="middle">
                {index === last ? 'now' : `-${Math.round(((last - index) * bucketMs) / 60_000)}m`}
              </text>
            ))}
            {series.map((s) => (
              <path
                key={s.id}
                d={buckets
                  .map((_, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(valueAt(i, s.id))}`)
                  .join('')}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
            {series.map((s) => (
              <circle
                key={s.id}
                cx={x(last)}
                cy={y(valueAt(last, s.id))}
                r={4}
                fill={s.color}
                className="ringed"
              />
            ))}
            {endLabels.map((label) => (
              <text
                key={label.id}
                x={plotRight + 10}
                y={label.y}
                className="value-label"
                dominantBaseline="middle"
              >
                {label.name}
              </text>
            ))}
            {hoverIndex !== null && (
              <g pointerEvents="none">
                <line
                  x1={x(hoverIndex)}
                  x2={x(hoverIndex)}
                  y1={MARGIN.top}
                  y2={HEIGHT - MARGIN.bottom}
                  className="crosshair"
                />
                {series.map((s) => (
                  <circle
                    key={s.id}
                    cx={x(hoverIndex)}
                    cy={y(valueAt(hoverIndex, s.id))}
                    r={4}
                    fill={s.color}
                    className="ringed"
                  />
                ))}
              </g>
            )}
            <rect
              x={MARGIN.left}
              y={MARGIN.top}
              width={plotRight - MARGIN.left}
              height={HEIGHT - MARGIN.top - MARGIN.bottom}
              fill="transparent"
              onPointerMove={onPointerMove}
              onPointerLeave={() => setHoverIndex(null)}
            />
          </svg>
        )}
        <Tooltip
          chartWidth={width}
          content={
            hovered && hoverIndex !== null
              ? {
                  x: x(hoverIndex),
                  y: MARGIN.top + 40,
                  title: formatClock(hovered.start),
                  rows: series.map((s) => ({
                    label: s.name,
                    value: formatCount(valueAt(hoverIndex, s.id)),
                    color: s.color,
                  })),
                }
              : null
          }
        />
      </div>
    </ChartCard>
  );
}

/** Direct end labels, unless any two would collide (then none; never nudge them apart). */
function placeEndLabels<T extends { readonly y: number }>(labels: readonly T[]): readonly T[] {
  const sorted = [...labels].sort((a, b) => a.y - b.y);
  const collides = sorted.some(
    (label, i) => i > 0 && label.y - (sorted[i - 1]?.y ?? 0) < MIN_LABEL_GAP,
  );
  return collides ? [] : sorted;
}
