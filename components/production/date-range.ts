import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isSameWeek,
  startOfMonth,
  startOfWeek,
  subWeeks,
} from 'date-fns'

export type PeriodUnit = 'week' | 'month' | 'all'

/** The Overview/queue-board period control's state: a unit (week/month, or
 * 'all' for no filtering) and an anchor date (yyyy-mm-dd, any day within the
 * currently-viewed week/month) that the prev/next steppers move. Ignored
 * when unit is 'all'. */
export interface PeriodValue {
  unit: PeriodUnit
  anchor: string
}

export const DEFAULT_PERIOD: PeriodValue = { unit: 'week', anchor: '' }

export interface ResolvedDateRange {
  from: Date
  to: Date
}

// A range wide enough to include anything a real record could hold - stands
// in for "no filtering" so isWithinDateRange needs no special case for 'all'.
const EPOCH = new Date(0)
const FAR_FUTURE = new Date(8640000000000000)

const WEEK_OPTS = { weekStartsOn: 1 as const }

function anchorDate(value: PeriodValue, now: Date): Date {
  return value.anchor ? new Date(value.anchor) : now
}

/** Resolves the period control's state into a concrete [from, to] window. */
export function resolvePeriod(value: PeriodValue, now: Date): ResolvedDateRange {
  if (value.unit === 'all') return { from: EPOCH, to: FAR_FUTURE }
  const anchor = anchorDate(value, now)
  if (value.unit === 'week') {
    return { from: startOfWeek(anchor, WEEK_OPTS), to: endOfWeek(anchor, WEEK_OPTS) }
  }
  return { from: startOfMonth(anchor), to: endOfMonth(anchor) }
}

/** The label shown on the period button - "This week"/"Last week"/"This
 * month" when the anchor lands there, else a formatted range. */
export function periodLabel(value: PeriodValue, now: Date): string {
  if (value.unit === 'all') return 'All time'
  const anchor = anchorDate(value, now)
  if (value.unit === 'week') {
    if (isSameWeek(anchor, now, WEEK_OPTS)) return 'This week'
    if (isSameWeek(anchor, subWeeks(now, 1), WEEK_OPTS)) return 'Last week'
    const start = startOfWeek(anchor, WEEK_OPTS)
    const end = endOfWeek(anchor, WEEK_OPTS)
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`
  }
  if (isSameMonth(anchor, now)) return 'This month'
  return format(anchor, 'MMMM yyyy')
}

/** Steps the period's anchor one unit forward/back (a no-op for 'all'). */
export function stepPeriod(value: PeriodValue, now: Date, direction: -1 | 1): PeriodValue {
  if (value.unit === 'all') return value
  const anchor = anchorDate(value, now)
  const next = value.unit === 'week' ? addWeeks(anchor, direction) : addMonths(anchor, direction)
  return { unit: value.unit, anchor: format(next, 'yyyy-MM-dd') }
}

/** Whether an ISO date string falls within a resolved range. Invalid/missing
 * dates never match, so a record with a bad timestamp is excluded rather
 * than silently counted. */
export function isWithinDateRange(
  dateStr: string | null | undefined,
  range: ResolvedDateRange,
): boolean {
  if (!dateStr) return false
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed >= range.from && parsed <= range.to
}
