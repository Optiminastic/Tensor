// Shared display formatters for money and percentages. The backend is the source
// of truth for the figures; these only format them for the UI, always with the
// mono/tabular treatment the "Editorial Ink" language reserves for numbers.

/** Formats a rupee figure with Indian digit grouping (e.g. ₹1,20,000). */
export function inr(value: number, digits = 0): string {
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

/** Formats a 0..1 fraction as a one-decimal percentage (e.g. 0.247 -> "24.7%"). */
export function pct(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`
}
