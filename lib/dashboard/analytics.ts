// Richer, time-and-rank aggregations for the brand Overview, kept out of
// `overview.ts` so each module stays small. Everything here is derived from real
// Tensor-Core fields (job timestamps, product names, quantities, filament/time
// estimates, hold/due flags) - nothing is synthesised. Pure functions only.

import type { Order, ProductionJob } from '@/lib/validators/production'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export interface WeeklyPoint {
  week: string // short start-of-window label, e.g. "12 Aug"
  created: number
  completed: number
}

export interface WeekAmount {
  week: string
  value: number
}

export type TrendDirection = 'up' | 'down' | 'flat'

export interface TrendDelta {
  label: string // e.g. "12%" or "new"
  direction: TrendDirection
}

export interface TopProduct {
  name: string
  units: number // summed quantity
  jobs: number
}

export interface ThroughputTotals {
  printHours: number // estimated, for queued + in-production work
  filamentKg: number // required, for queued + in-production work
  inProduction: number // job count currently printing
}

export interface AttentionItem {
  id: string
  jobNumber: string
  title: string
  reason: string
  severity: 'warning' | 'danger'
  photoFileId: string | null // a personalisation photo, when the job carries one
}

function isCompleted(job: ProductionJob): boolean {
  return job.status === 'completed'
}

function isPending(job: ProductionJob): boolean {
  return job.status === 'queued' || job.status === 'in_production' || job.status === 'printing'
}

function weekLabel(startMs: number): string {
  return new Date(startMs).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/**
 * Jobs created vs completed across the last `weeks` rolling 7-day windows, anchored
 * to now. "Created" buckets on `created_at`; "completed" buckets completed jobs on
 * `updated_at` (the closest signal to when they finished).
 */
export function weeklyActivity(jobs: ProductionJob[], weeks = 8): WeeklyPoint[] {
  const now = Date.now()
  const points: WeeklyPoint[] = Array.from({ length: weeks }, (_, index) => {
    const weeksAgo = weeks - 1 - index
    return { week: weekLabel(now - weeksAgo * WEEK_MS), created: 0, completed: 0 }
  })

  const bucketFor = (iso: string): number => {
    const weeksAgo = Math.floor((now - new Date(iso).getTime()) / WEEK_MS)
    return weeks - 1 - weeksAgo // index into `points`, or out of range
  }

  for (const job of jobs) {
    const created = bucketFor(job.created_at)
    if (created >= 0 && created < weeks) points[created].created += 1
    if (isCompleted(job)) {
      const done = bucketFor(job.updated_at)
      if (done >= 0 && done < weeks) points[done].completed += 1
    }
  }
  return points
}

/** Revenue captured per rolling 7-day window, for the revenue sparkline. */
export function weeklyRevenue(orders: Order[], weeks = 8): WeekAmount[] {
  const now = Date.now()
  const points: WeekAmount[] = Array.from({ length: weeks }, (_, index) => ({
    week: weekLabel(now - (weeks - 1 - index) * WEEK_MS),
    value: 0,
  }))
  for (const order of orders) {
    const index = weeks - 1 - Math.floor((now - new Date(order.imported_at).getTime()) / WEEK_MS)
    if (index >= 0 && index < weeks) points[index].value += order.total_price
  }
  return points
}

/**
 * The change from the previous window to the latest, as a labelled direction for a
 * KPI chip. Null when there is too little history to be honest about a trend.
 */
export function weekOverWeekDelta(series: number[]): TrendDelta | null {
  if (series.length < 2) return null
  const previous = series[series.length - 2]
  const latest = series[series.length - 1]
  if (previous === 0) return latest > 0 ? { label: 'new', direction: 'up' } : null

  const change = ((latest - previous) / previous) * 100
  return { label: `${Math.abs(Math.round(change))}%`, direction: directionOf(change) }
}

function directionOf(change: number): TrendDirection {
  if (change > 0.5) return 'up'
  if (change < -0.5) return 'down'
  return 'flat'
}

/** The busiest products by units ordered, for a ranked bar list. */
export function topProducts(jobs: ProductionJob[], limit = 5): TopProduct[] {
  const byName = new Map<string, TopProduct>()
  for (const job of jobs) {
    const name = job.product_name ?? job.sku ?? 'Unattributed'
    const current = byName.get(name) ?? { name, units: 0, jobs: 0 }
    current.units += job.quantity
    current.jobs += 1
    byName.set(name, current)
  }
  return [...byName.values()].sort((a, b) => b.units - a.units).slice(0, limit)
}

/** Outstanding print workload: hours and filament for jobs not yet finished. */
export function throughput(jobs: ProductionJob[]): ThroughputTotals {
  let minutes = 0
  let grams = 0
  let inProduction = 0
  for (const job of jobs) {
    if (!isPending(job)) continue
    minutes += (job.estimated_print_time_minutes ?? 0) * job.quantity
    grams += (job.filament_grams_required ?? 0) * job.quantity
    if (job.status !== 'queued') inProduction += 1
  }
  return { printHours: minutes / 60, filamentKg: grams / 1000, inProduction }
}

/** Jobs that need a human: held (with a reason) or past due and not yet done. */
export function attentionItems(jobs: ProductionJob[], limit = 6): AttentionItem[] {
  const now = Date.now()
  const items: AttentionItem[] = []
  for (const job of jobs) {
    const title = job.product_name ?? job.description
    const photoFileId = job.personalisation_photo_file_id ?? null
    if (job.held) {
      items.push({
        id: job.id,
        jobNumber: job.job_number,
        title,
        reason: job.issue_reason ?? 'On hold',
        severity: 'danger',
        photoFileId,
      })
      continue
    }
    if (job.due_date && !isCompleted(job) && new Date(job.due_date).getTime() < now) {
      items.push({
        id: job.id,
        jobNumber: job.job_number,
        title,
        reason: 'Past due',
        severity: 'warning',
        photoFileId,
      })
    }
  }
  return items.slice(0, limit)
}
