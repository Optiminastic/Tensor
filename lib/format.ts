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

/** Formats a countdown in seconds as "1h 24m" (or "<1m" once under a minute). */
export function countdown(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return '<1m'
}

/** Formats an ISO timestamp as "6 Aug 2026, 1:29 PM" - date and time to the minute, never seconds or a raw offset. */
export function dateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
