import type { BatchRecord, OrderRecord } from '@/components/production/types'
import type { FleetMachine } from '@/lib/validators/machine-fleet'
import type { Filament, ProductionJob } from '@/lib/validators/production'

import { jobStage } from './pipeline'

export interface CountBreakdown {
  total: number
  parts: { label: string; value: number; tone: 'danger' | 'warning' | 'success' | 'muted' }[]
}

export interface FleetRow {
  id: string
  name: string
  model: string | null
  status: FleetMachine['status']
  statusReason: string | null
  /** 0..1 through the current plate, from layers. Null when not printing. */
  progress: number | null
  layers: string | null
  remainingSeconds: number | null
  queuedBatches: number
  jobsDone: number
}

const QUEUED_BATCH_STATUSES = new Set(['pending_approval', 'open'])

export function orderCounts(orders: OrderRecord[]): CountBreakdown {
  return {
    total: orders.length,
    parts: [
      {
        label: 'Pending',
        value: orders.filter(o => o.status === 'pending').length,
        tone: 'warning',
      },
      {
        label: 'Refunded or cancelled',
        value: orders.filter(o => o.status === 'refunded' || o.status === 'cancelled').length,
        tone: 'danger',
      },
    ],
  }
}

export function jobCounts(jobs: ProductionJob[]): CountBreakdown {
  return {
    total: jobs.length,
    parts: [
      {
        label: 'Printed',
        value: jobs.filter(j => j.status === 'completed').length,
        tone: 'success',
      },
      { label: 'On a bed', value: jobs.filter(j => Boolean(j.batch_id)).length, tone: 'muted' },
      { label: 'Failed', value: jobs.filter(j => j.status === 'failed').length, tone: 'danger' },
    ],
  }
}

export function batchCounts(batches: BatchRecord[]): CountBreakdown {
  const count = (status: string): number => batches.filter(b => b.status === status).length
  return {
    total: batches.length,
    parts: [
      { label: 'Ready', value: count('open'), tone: 'muted' },
      { label: 'Printing', value: count('in_progress'), tone: 'warning' },
      { label: 'Done', value: count('completed'), tone: 'success' },
      {
        label: 'Short of material',
        value: batches.filter(b => b.materialShortage).length,
        tone: 'danger',
      },
    ],
  }
}

/** Packed within the range: the pipeline's last stage is a tally, not a queue. */
export function packedCount(jobs: ProductionJob[]): number {
  return jobs.filter(j => jobStage(j) === 'packed').length
}

/** Filament below its reorder level, lowest share of the level first. */
export function lowFilament(filaments: Filament[]): Filament[] {
  return filaments
    .filter(f => f.grams_available < f.reorder_level_grams)
    .sort(
      (a, b) =>
        a.grams_available / Math.max(1, a.reorder_level_grams) -
        b.grams_available / Math.max(1, b.reorder_level_grams),
    )
}

function tally(keys: (string | null | undefined)[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const key of keys) if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
  return counts
}

function layerProgress(m: FleetMachine): { progress: number | null; layers: string | null } {
  if (m.status !== 'running' || !m.total_layers || m.current_layer === null) {
    return { progress: null, layers: null }
  }
  return {
    progress: Math.min(1, m.current_layer / m.total_layers),
    layers: `Layer ${m.current_layer} of ${m.total_layers}`,
  }
}

/**
 * Each printer with what it is doing, how far through, and how much waits for
 * it. Jobs done are counted within the range; queued beds are live.
 */
export function fleetRows(
  machines: FleetMachine[],
  batches: BatchRecord[],
  jobsInRange: ProductionJob[],
): FleetRow[] {
  const machineOfBatch = new Map(batches.map(b => [b.id, b.machineId]))
  const done = tally(
    jobsInRange
      .filter(j => j.status === 'completed')
      .map(j => machineOfBatch.get(j.batch_id ?? '')),
  )
  const queued = tally(
    batches.filter(b => QUEUED_BATCH_STATUSES.has(b.status)).map(b => b.machineId),
  )
  return machines.map(m => ({
    id: m.id,
    name: m.name,
    model: m.model ?? null,
    status: m.status,
    statusReason: m.status_reason,
    ...layerProgress(m),
    remainingSeconds: m.remaining_seconds,
    queuedBatches: queued.get(m.id) ?? 0,
    jobsDone: done.get(m.id) ?? 0,
  }))
}
