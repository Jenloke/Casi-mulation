import { type PointerEvent, type RefObject, useState } from 'react';

export interface TooltipRow {
  readonly label: string;
  readonly value: string;
  readonly color?: string;
}

export interface TooltipContent {
  readonly x: number;
  readonly y: number;
  readonly title: string;
  readonly rows: readonly TooltipRow[];
}

/** Hover readout: the value leads, the series name follows, keyed by a short line. */
export function Tooltip(props: { content: TooltipContent | null; chartWidth: number }) {
  const { content, chartWidth } = props;
  if (!content) return null;
  const flip = content.x > chartWidth * 0.6;
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-36 rounded-lg bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md ring-1 ring-foreground/10"
      style={{
        left: content.x,
        top: content.y,
        transform: flip ? 'translate(calc(-100% - 12px), -50%)' : 'translate(12px, -50%)',
      }}
    >
      <p className="mb-1 text-muted-foreground">{content.title}</p>
      {content.rows.map((row) => (
        <p key={row.label} className="flex items-center gap-1.5">
          {row.color && (
            <span
              className="inline-block h-0.5 w-3 rounded-[1px]"
              style={{ background: row.color }}
            />
          )}
          <strong className="font-semibold tabular-nums">{row.value}</strong>
          <span className="text-muted-foreground">{row.label}</span>
        </p>
      ))}
    </div>
  );
}

/** Per-mark hover for bar and dot charts, positioned relative to the chart container. */
export function useHoverTip(container: RefObject<HTMLElement | null>) {
  const [tip, setTip] = useState<TooltipContent | null>(null);
  const show = (event: PointerEvent, title: string, rows: readonly TooltipRow[]) => {
    const box = container.current?.getBoundingClientRect();
    if (box) setTip({ x: event.clientX - box.left, y: event.clientY - box.top, title, rows });
  };
  return { tip, show, hide: () => setTip(null) };
}
