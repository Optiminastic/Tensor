import {
  DEFAULT_PERIOD,
  type PeriodUnit,
  type PeriodValue,
} from '@/components/production/date-range'

/**
 * The Agent overview's period, to and from the URL.
 *
 * ?unit=week&anchor=2026-10-13, ?unit=custom&from=…&to=…, ?unit=all. Anything
 * unreadable falls back to this week rather than to an error: a mangled link
 * should still open the page.
 */

const UNITS: PeriodUnit[] = ['week', 'month', 'all', 'custom']
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export type PeriodSearch = Partial<Record<'unit' | 'anchor' | 'from' | 'to', string>>

function day(raw: string | undefined): string {
  return raw && DAY_PATTERN.test(raw) ? raw : ''
}

export function periodFromSearch(search: PeriodSearch): PeriodValue {
  const unit = UNITS.find(u => u === search.unit)
  if (!unit) return DEFAULT_PERIOD
  if (unit === 'custom') {
    return { unit, anchor: '', from: day(search.from), to: day(search.to) }
  }
  return { unit, anchor: day(search.anchor) }
}

export function periodToSearch(period: PeriodValue): string {
  const params = new URLSearchParams({ unit: period.unit })
  if (period.unit === 'custom') {
    if (period.from) params.set('from', period.from)
    if (period.to) params.set('to', period.to)
  } else if (period.anchor) {
    params.set('anchor', period.anchor)
  }
  return params.toString()
}
