'use client'

import { useMemo, useState, type JSX } from 'react'

import { type OverviewStat, OverviewStats } from '@/components/dashboard/overview-stats'
import {
  DEFAULT_PERIOD,
  isWithinDateRange,
  type PeriodValue,
  resolvePeriod,
} from '@/components/production/date-range'
import { MachineStatusTable } from '@/components/production/machine-status-table'
import { MachinesPanel } from '@/components/production/machines-panel'
import { OverviewDateRange } from '@/components/production/overview-date-range'
import { RecentJobsTable } from '@/components/production/recent-jobs-table'
import type {
  BatchRecord,
  MachineSummary,
  OrderRecord,
  ProductionJob as RecentJob,
} from '@/components/production/types'
import type { FleetMachine } from '@/lib/validators/machine-fleet'
import type { Filament, ProductionJob } from '@/lib/validators/production'

interface ProductionOverviewProps {
  brand: string
  orders: OrderRecord[]
  jobs: ProductionJob[]
  batches: BatchRecord[]
  fleetMachines: FleetMachine[]
  filaments: Filament[]
  recentJobs: RecentJob[]
  machines: MachineSummary[]
}

const QUEUED_BATCH_STATUSES = new Set(['pending_approval', 'open'])

export function ProductionOverview({
  brand,
  orders,
  jobs,
  batches,
  fleetMachines,
  filaments,
  recentJobs,
  machines,
}: ProductionOverviewProps): JSX.Element {
  const [dateRange, setDateRange] = useState<PeriodValue>(DEFAULT_PERIOD)
  const range = useMemo(() => resolvePeriod(dateRange, new Date()), [dateRange])

  const ordersInRange = useMemo(
    () => orders.filter(o => isWithinDateRange(o.submittedAt, range)),
    [orders, range],
  )
  const jobsInRange = useMemo(
    () => jobs.filter(j => isWithinDateRange(j.created_at, range)),
    [jobs, range],
  )
  const batchesInRange = useMemo(
    () => batches.filter(b => isWithinDateRange(b.createdAt, range)),
    [batches, range],
  )

  const orderStat: OverviewStat = useMemo(() => {
    const pending = ordersInRange.filter(o => o.status === 'pending').length
    const issues = ordersInRange.filter(
      o => o.status === 'refunded' || o.status === 'cancelled',
    ).length
    return {
      label: 'Orders Received',
      value: String(ordersInRange.length),
      subCounts: [
        { label: 'Pending', value: pending, tone: 'warning' },
        { label: 'Issues', value: issues, tone: 'danger' },
      ],
    }
  }, [ordersInRange])

  const jobStat: OverviewStat = useMemo(() => {
    const issues = jobsInRange.filter(j => j.status === 'failed').length
    const done = jobsInRange.filter(j => j.status === 'completed').length
    const batched = jobsInRange.filter(j => Boolean(j.batch_id)).length
    return {
      label: 'Jobs Created',
      value: String(jobsInRange.length),
      subCounts: [
        { label: 'Issues', value: issues, tone: 'danger' },
        { label: 'Done', value: done, tone: 'success' },
        { label: 'Batched', value: batched, tone: 'muted' },
      ],
    }
  }, [jobsInRange])

  const batchStat: OverviewStat = useMemo(() => {
    const issue = batchesInRange.filter(b => b.materialShortage).length
    const ready = batchesInRange.filter(b => b.status === 'open').length
    const done = batchesInRange.filter(b => b.status === 'completed').length
    return {
      label: 'Batches Created',
      value: String(batchesInRange.length),
      subCounts: [
        { label: 'Issue', value: issue, tone: 'danger' },
        { label: 'Ready', value: ready, tone: 'accent' },
        { label: 'Done', value: done, tone: 'success' },
      ],
    }
  }, [batchesInRange])

  const assemblyStat: OverviewStat = useMemo(() => {
    const pending = jobsInRange.filter(
      j => j.status === 'completed' && j.assembly_status === 'pending',
    ).length
    const completed = jobsInRange.filter(j => j.assembly_status === 'completed').length
    const notRequired = jobsInRange.filter(j => j.assembly_status === 'not_required').length
    return {
      label: 'Pending Assembly',
      value: String(pending),
      subCounts: [
        { label: 'Completed', value: completed, tone: 'success' },
        { label: 'Not required', value: notRequired, tone: 'muted' },
      ],
    }
  }, [jobsInRange])

  const packagingStat: OverviewStat = useMemo(() => {
    const pending = jobsInRange.filter(
      j => j.qc_status === 'passed' && j.packaging_status === 'pending',
    ).length
    const packed = jobsInRange.filter(j => j.packaging_status === 'packaged').length
    return {
      label: 'Pending Packaging',
      value: String(pending),
      subCounts: [{ label: 'Packed', value: packed, tone: 'success' }],
    }
  }, [jobsInRange])

  // Filament stock has no date dimension (current stock, not a historical
  // log) - always the live snapshot, regardless of the selected range.
  const filamentStat: OverviewStat = useMemo(() => {
    const low = filaments.filter(f => f.grams_available < f.reorder_level_grams).length
    return {
      label: 'Low Stock Filament',
      value: String(low),
      subCounts: [{ label: 'Tracked', value: filaments.length, tone: 'muted' }],
    }
  }, [filaments])

  // Jobs-done is date-ranged (matches the Jobs card above); queued batches is
  // a live count of what's currently waiting, independent of the range.
  const machineStatusRows = useMemo(() => {
    const machineIdByBatchId = new Map<string, string>()
    for (const b of batches) if (b.machineId) machineIdByBatchId.set(b.id, b.machineId)

    const jobsDoneByMachine = new Map<string, number>()
    for (const j of jobsInRange) {
      if (j.status !== 'completed' || !j.batch_id) continue
      const machineId = machineIdByBatchId.get(j.batch_id)
      if (!machineId) continue
      jobsDoneByMachine.set(machineId, (jobsDoneByMachine.get(machineId) ?? 0) + 1)
    }

    const queuedByMachine = new Map<string, number>()
    for (const b of batches) {
      if (!b.machineId || !QUEUED_BATCH_STATUSES.has(b.status)) continue
      queuedByMachine.set(b.machineId, (queuedByMachine.get(b.machineId) ?? 0) + 1)
    }

    return fleetMachines.map(m => ({
      id: m.id,
      name: m.name,
      status: m.status,
      jobsDone: jobsDoneByMachine.get(m.id) ?? 0,
      queuedBatches: queuedByMachine.get(m.id) ?? 0,
    }))
  }, [fleetMachines, batches, jobsInRange])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Every figure below reflects the selected date range, except live status/current stock.
        </p>
        <OverviewDateRange value={dateRange} onChange={setDateRange} />
      </div>

      <OverviewStats stats={[orderStat, jobStat, batchStat]} />

      <div className="grid gap-1.5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentJobsTable jobs={recentJobs} />
        </div>
        <MachinesPanel machines={machines} />
      </div>

      <MachineStatusTable brand={brand} rows={machineStatusRows} />

      <OverviewStats stats={[assemblyStat, packagingStat, filamentStat]} />
    </div>
  )
}
