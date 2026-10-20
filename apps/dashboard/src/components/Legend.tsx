export type LegendSwatch = 'rect' | 'tint' | 'line' | 'dot' | 'ring' | 'tick';

export interface LegendItem {
  readonly label: string;
  readonly color: string;
  readonly swatch?: LegendSwatch;
}

/** Identity never rides on color alone: every multi-series chart gets one of these. */
export function Legend(props: { items: readonly LegendItem[] }) {
  return (
    <ul className="legend">
      {props.items.map((item) => (
        <li key={item.label}>
          <span
            className={`swatch swatch-${item.swatch ?? 'rect'}`}
            style={{ color: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
