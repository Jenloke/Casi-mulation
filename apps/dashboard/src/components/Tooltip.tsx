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
      className="tooltip"
      style={{
        left: content.x,
        top: content.y,
        transform: flip ? 'translate(calc(-100% - 12px), -50%)' : 'translate(12px, -50%)',
      }}
    >
      <p className="tooltip-title">{content.title}</p>
      {content.rows.map((row) => (
        <p key={row.label} className="tooltip-row">
          {row.color && <span className="line-key" style={{ background: row.color }} />}
          <strong>{row.value}</strong>
          <span>{row.label}</span>
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
