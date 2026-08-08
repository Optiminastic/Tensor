import { endOfDay, startOfDay, subDays } from 'date-fns'

export type DateRangePreset = 'today' | 'week' | 'month' | 'custom'

/** The Overview's date-range control state. from/to are yyyy-mm-dd strings
 * (native <input type="date"> format), only meaningful when preset is
 * 'custom'. */
export interface DateRangeValue {
  preset: DateRangePreset
  from: string
  to: string
}

export const DEFAULT_DATE_RANGE: DateRangeValue = { preset: 'week', from: '', to: '' }

export interface ResolvedDateRange {
  from: Date
  to: Date
}

/** Resolves the control's state into a concrete [from, to] window, rolling
 * back from now - 'today' since local midnight, 'week'/'month' the trailing
 * 7/30 days. A custom range with an unset side falls back to the last 7 days
 * so an in-progress selection never silently matches everything. */
export function resolveDateRange(value: DateRangeValue, now: Date): ResolvedDateRange {
  if (value.preset === 'today') return { from: startOfDay(now), to: endOfDay(now) }
  if (value.preset === 'week') return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) }
  if (value.preset === 'month') return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) }

  const from = value.from ? startOfDay(new Date(value.from)) : startOfDay(subDays(now, 6))
  const to = value.to ? endOfDay(new Date(value.to)) : endOfDay(now)
  return { from, to }
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
