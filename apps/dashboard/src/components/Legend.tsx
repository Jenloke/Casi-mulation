import { cn } from '@casino/ui/lib/utils';

export type LegendSwatch = 'rect' | 'tint' | 'line' | 'dot' | 'ring' | 'tick';

export interface LegendItem {
  readonly label: string;
  readonly color: string;
  readonly swatch?: LegendSwatch;
}

/** Each shape echoes its mark: bar, tinted bar, line, dot, hollow ring, theory tick. */
const SWATCH_SHAPE: Readonly<Record<LegendSwatch, string>> = {
  rect: 'size-3 rounded-[3px] bg-current',
  tint: 'size-3 rounded-[3px] bg-current opacity-40',
  line: 'h-0.5 w-3 rounded-[1px] bg-current',
  dot: 'size-2.5 rounded-full bg-current',
  ring: 'size-2.5 rounded-full border-2 border-current',
  tick: 'h-3 w-0.5 bg-current',
};

/** Identity never rides on color alone: every multi-series chart gets one of these. */
export function Legend(props: { items: readonly LegendItem[] }) {
  return (
    <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {props.items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            className={cn('inline-block shrink-0', SWATCH_SHAPE[item.swatch ?? 'rect'])}
            style={{ color: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
