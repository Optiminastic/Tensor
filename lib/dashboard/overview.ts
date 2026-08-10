// Aggregation for the brand Overview dashboard. Pure functions that fold the raw
// lists from Tensor-Core (orders, production jobs, machines) into the small,
// serialisable shapes the overview cards render. No I/O, no React - so the server
// page can compute everything once and hand plain props to the client charts.
//
// Colours are design tokens (CSS custom properties), not raw hex, and every
// segment carries a `label` so identity is never colour-alone (see the dataviz
// rules in CLAUDE.md). The status hues are the reserved Editorial Ink status ramp
// plus one neutral (`--border-strong`) for the "idle / other" bucket.
//
// Note: these endpoints are workspace-wide today; brand-scoping them is a tracked
// backend follow-up, so the copy speaks to "this workspace", not a single brand.

import type { Machine } from '@/lib/validators/machines'
import type { Order, ProductionJob } from '@/lib/validators/production'

/**
 * One slice of a status donut or segmented bar: an entity, its magnitude, and the
 * token that carries its identity. The legend reads `label` (not the colour), so
 * the encoding survives colour blindness and greyscale printing.
 */
export interface StatusSegment {
  key: string
  label: string
  value: number
  color: string // a CSS custom property, e.g. 'var(--success)'
}

export interface JobsSummary {
  total: number
  segments: StatusSegment[]
  completed: number
  failed: number
  completionRate: number // 0..1
}

export interface MachinesSummary {
  total: number
  segments: StatusSegment[]
  active: number // online + busy
  utilisation: number // 0..1, active / total
}

export interface RevenueSummary {
  total: number
  orderCount: number
  averageOrderValue: number
  segments: StatusSegment[]
}

type JobBucket = 'completed' | 'in_production' | 'queued' | 'failed'

/** Collapse the many raw job states Tensor-Core emits into four display buckets. */
function jobBucket(status: string): JobBucket {
  switch (status) {
    case 'completed':
      return 'completed'
    case 'in_production':
    case 'printing':
      return 'in_production'
    case 'failed':
    case 'cancelled':
      return 'failed'
    default:
      return 'queued'
  }
}

export function summariseJobs(jobs: ProductionJob[]): JobsSummary {
  const counts: Record<JobBucket, number> = {
    completed: 0,
    in_production: 0,
    queued: 0,
    failed: 0,
  }
  for (const job of jobs) counts[jobBucket(job.status)] += 1

  const total = jobs.length
  const segments: StatusSegment[] = [
    { key: 'completed', label: 'Completed', value: counts.completed, color: 'var(--success)' },
    {
      key: 'in_production',
      label: 'In production',
      value: counts.in_production,
      color: 'var(--accent)',
    },
    { key: 'queued', label: 'Queued', value: counts.queued, color: 'var(--border-strong)' },
    { key: 'failed', label: 'Failed', value: counts.failed, color: 'var(--danger)' },
  ]
  return {
    total,
    segments,
    completed: counts.completed,
    failed: counts.failed,
    completionRate: total ? counts.completed / total : 0,
  }
}

type MachineBucket = 'online' | 'busy' | 'offline' | 'maintenance'

export function summariseMachines(machines: Machine[]): MachinesSummary {
  const counts: Record<MachineBucket, number> = {
    online: 0,
    busy: 0,
    offline: 0,
    maintenance: 0,
  }
  for (const machine of machines) {
    if (machine.status in counts) counts[machine.status as MachineBucket] += 1
  }

  const total = machines.length
  const active = counts.online + counts.busy
  const segments: StatusSegment[] = [
    { key: 'online', label: 'Online', value: counts.online, color: 'var(--success)' },
    { key: 'busy', label: 'Busy', value: counts.busy, color: 'var(--accent)' },
    {
      key: 'maintenance',
      label: 'Maintenance',
      value: counts.maintenance,
      color: 'var(--warning)',
    },
    { key: 'offline', label: 'Offline', value: counts.offline, color: 'var(--border-strong)' },
  ]
  return { total, segments, active, utilisation: total ? active / total : 0 }
}

type RevenueBucket = 'paid' | 'pending' | 'other'

/** Map a Shopify financial status onto a paid / pending / other bucket. */
function revenueBucket(status: string): RevenueBucket {
  switch (status) {
    case 'paid':
      return 'paid'
    case 'pending':
    case 'authorized':
    case 'partially_paid':
      return 'pending'
    default:
      return 'other'
  }
}

const REVENUE_SLICES: ReadonlyArray<{ key: RevenueBucket; label: string; color: string }> = [
  { key: 'paid', label: 'Paid', color: 'var(--success)' },
  { key: 'pending', label: 'Pending', color: 'var(--warning)' },
  { key: 'other', label: 'Refunded / other', color: 'var(--border-strong)' },
]

export function summariseRevenue(orders: Order[]): RevenueSummary {
  const sums: Record<RevenueBucket, number> = { paid: 0, pending: 0, other: 0 }
  let total = 0
  for (const order of orders) {
    total += order.total_price
    sums[revenueBucket(order.financial_status)] += order.total_price
  }

  const orderCount = orders.length
  const segments = REVENUE_SLICES.map(slice => ({
    key: slice.key,
    label: slice.label,
    value: sums[slice.key],
    color: slice.color,
  }))
  return {
    total,
    orderCount,
    averageOrderValue: orderCount ? total / orderCount : 0,
    segments,
  }
}
