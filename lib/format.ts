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

/** The stand-in for a timestamp that is absent or unparseable, matching the
 * placeholder the production adapters already use for missing fields. */
const NO_DATE = '-'

const pad2 = (n: number): string => String(n).padStart(2, '0')

/**
 * Formats an ISO timestamp as "16-08-2026 16:09" - DD-MM-YYYY and HH:MM, never
 * seconds and never a raw offset.
 *
 * Built from the date parts rather than toLocaleString for two reasons. The
 * format is then fixed rather than at the mercy of whatever locale the runtime
 * happens to report - and, more importantly, `toLocaleString(undefined, ...)`
 * resolves its locale separately on the server and in the browser, so the same
 * timestamp could render two different ways either side of hydration. React
 * reports that as "server rendered text didn't match the client" and throws the
 * subtree away.
 *
 * Null, empty and unparseable values return the placeholder instead of "Invalid
 * Date", which is what a missing due date used to render as.
 */
export function dateTime(value: string | null | undefined): string {
  if (!value) return NO_DATE
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return NO_DATE
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** Formats an ISO timestamp as "16-08-2026" - the same rules as dateTime, for
 * fields where the time of day carries no meaning. */
export function dateOnly(value: string | null | undefined): string {
  if (!value) return NO_DATE
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return NO_DATE
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`
}
