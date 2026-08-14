import {
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isSameWeek,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subWeeks,
} from 'date-fns'

export type PeriodUnit = 'week' | 'month' | 'all' | 'custom'

/** The Overview/queue-board period control's state: a unit (week/month,
 * 'all' for no filtering, or 'custom' for an explicit from/to range) and an
 * anchor date (yyyy-mm-dd, any day within the currently-viewed week/month)
 * that the prev/next steppers move. Ignored when unit is 'all' or 'custom'. */
export interface PeriodValue {
  unit: PeriodUnit
  anchor: string
  /** Custom range bounds (yyyy-mm-dd), read only when unit is 'custom'.
   * Either side may be empty, giving an open-ended range. */
  from?: string
  to?: string
}

export const DEFAULT_PERIOD: PeriodValue = { unit: 'week', anchor: '' }

/** The right default for a table that previously showed every row. Opening
 * one on a week would silently hide most of its contents, which reads as
 * data loss rather than a filter. */
export const ALL_TIME_PERIOD: PeriodValue = { unit: 'all', anchor: '' }

/** Parses a yyyy-mm-dd bound as a LOCAL day. parseISO (unlike `new Date`,
 * which reads a date-only string as UTC midnight) keeps the day the user
 * picked from sliding across a boundary for anyone east or west of UTC. */
function parseDay(day: string | undefined): Date | null {
  if (!day) return null
  const parsed = parseISO(day)
  return isValid(parsed) ? parsed : null
}

/** A custom range's bounds, lowest first. Bounds entered in either order mean
 * the same window: a picker happily lets you set "to" before "from", and an
 * inverted range that silently matches nothing reads as a broken filter
 * rather than a mistyped one. */
function customBounds(value: PeriodValue): { lo: Date | null; hi: Date | null } {
  const a = parseDay(value.from)
  const b = parseDay(value.to)
  if (a && b && a > b) return { lo: b, hi: a }
  return { lo: a, hi: b }
}

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
  if (value.unit === 'custom') {
    const { lo, hi } = customBounds(value)
    // Whole days, not the midnights the inputs give: a range of Mar 1 to Mar 1
    // has to include everything that happened on Mar 1, not just its first
    // instant. An empty side stays open-ended.
    return { from: lo ? startOfDay(lo) : EPOCH, to: hi ? endOfDay(hi) : FAR_FUTURE }
  }
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
  if (value.unit === 'custom') {
    const { lo, hi } = customBounds(value)
    if (lo && hi) {
      if (isSameDay(lo, hi)) return format(lo, 'MMM d, yyyy')
      return `${format(lo, 'MMM d')} - ${format(hi, 'MMM d, yyyy')}`
    }
    if (lo) return `From ${format(lo, 'MMM d, yyyy')}`
    if (hi) return `Until ${format(hi, 'MMM d, yyyy')}`
    // 'custom' with neither bound filters nothing, so say so rather than
    // showing an empty pill.
    return 'All time'
  }
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

/** Steps the period's anchor one unit forward/back. A no-op for 'all' and for
 * 'custom': a custom range's bounds are exactly what the user typed, and
 * shifting them out from under a stepper press would be a surprise (the
 * control disables its steppers for both). */
export function stepPeriod(value: PeriodValue, now: Date, direction: -1 | 1): PeriodValue {
  if (value.unit === 'all' || value.unit === 'custom') return value
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
