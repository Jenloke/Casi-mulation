export function formatChips(chips: number): string {
  return chips.toLocaleString('en-US');
}

export function percent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}
