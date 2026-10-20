const whole = new Intl.NumberFormat('en-US');
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export function formatCount(value: number): string {
  return whole.format(value);
}

/** Whole numbers below 1,000, compact above (1.2K, 3.4M). */
export function formatCompact(value: number): string {
  return Math.abs(value) < 1_000 ? whole.format(value) : compact.format(value);
}

export function formatPercent(ratio: number | null, digits = 1): string {
  return ratio === null ? '–' : `${(ratio * 100).toFixed(digits)}%`;
}

export function formatClock(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString('en-US', { hour12: false });
}
