import type { PopulationDto } from '@casino/contracts';
import { ChartCard } from '../components/ChartCard.tsx';
import { Legend } from '../components/Legend.tsx';
import { Tooltip, useHoverTip } from '../components/Tooltip.tsx';
import { useMeasuredWidth } from '../components/useMeasuredWidth.ts';
import { formatCount, formatPercent } from '../format.ts';
import { hBarPath } from './geometry.ts';

const BAR = 14;
const ROW = 40;
const LABEL_WIDTH = 104;
const VALUE_WIDTH = 96;
const SURFACE_GAP = 2;
const GUESTS = 'var(--chart-7)';
const BOTS = 'var(--chart-deemphasis)';

/** Emphasis form: guests in the accent, bots in gray, as shares of all play. */
export function PopulationChart({ population }: { population: PopulationDto }) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>();
  const hover = useHoverTip(ref);
  const { human, bot } = population.byKind;
  const measures = [
    { label: 'Rounds played', guests: human.rounds, bots: bot.rounds },
    { label: 'Chips wagered', guests: human.wagered, bots: bot.wagered },
  ];
  const plotWidth = Math.max(1, width - LABEL_WIDTH - VALUE_WIDTH);
  const table = {
    columns: ['Measure', 'Guests', 'Bots', 'Guest share'],
    rows: measures.map((m) => [
      m.label,
      formatCount(m.guests),
      formatCount(m.bots),
      formatPercent(share(m.guests, m.bots)),
    ]),
  };
  const legend = (
    <Legend
      items={[
        { label: `Guests (${population.humansOnline} online)`, color: GUESTS },
        { label: `Bots (${population.botsOnline} online)`, color: BOTS },
      ]}
    />
  );

  return (
    <ChartCard
      title="Guests vs bots"
      subtitle="Who is doing the playing"
      table={table}
      legend={legend}
    >
      <div ref={ref} className="relative w-full" onPointerLeave={hover.hide}>
        {width > 0 && (
          <svg className="block overflow-visible" width={width} height={measures.length * ROW}>
            <title>Share of rounds and wagers by guests and bots</title>
            {measures.map((measure, index) => {
              const y = index * ROW + (ROW - BAR) / 2;
              const guestShare = share(measure.guests, measure.bots);
              const guestWidth = guestShare === null ? 0 : guestShare * plotWidth;
              const botStart = LABEL_WIDTH + guestWidth + (guestWidth > 0 ? SURFACE_GAP : 0);
              const botWidth = guestShare === null ? 0 : LABEL_WIDTH + plotWidth - botStart;
              return (
                <g
                  key={measure.label}
                  onPointerMove={(event) =>
                    hover.show(event, measure.label, [
                      { label: 'guests', value: formatCount(measure.guests), color: GUESTS },
                      { label: 'bots', value: formatCount(measure.bots), color: BOTS },
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
                    {measure.label}
                  </text>
                  {guestWidth > 0 && (
                    <rect x={LABEL_WIDTH} y={y} width={guestWidth} height={BAR} fill={GUESTS} />
                  )}
                  <path d={hBarPath(botStart, y, botWidth, BAR)} fill={BOTS} />
                  <text
                    x={LABEL_WIDTH + plotWidth + 10}
                    y={y + BAR / 2}
                    className="fill-muted-foreground text-[11px]"
                    dominantBaseline="middle"
                  >
                    {guestShare === null ? 'no play yet' : `guests ${formatPercent(guestShare)}`}
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

function share(part: number, rest: number): number | null {
  return part + rest > 0 ? part / (part + rest) : null;
}
