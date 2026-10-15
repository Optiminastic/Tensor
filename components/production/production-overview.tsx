'use client'

import { useMemo, useState, type JSX } from 'react'

import { AttentionTile } from '@/components/dashboard/overview/attention-tile'
import { PillLink } from '@/components/landing/pill-link'
import {
  DEFAULT_PERIOD,
  isWithinDateRange,
  type PeriodValue,
  resolvePeriod,
} from '@/components/production/date-range'
import { OverviewDateRange } from '@/components/production/overview-date-range'
import type {
  BatchRecord,
  OrderRecord,
  ProductionJob as RecentJob,
} from '@/components/production/types'
import { useFleetMachines } from '@/hooks/use-fleet-poll'
import type { FleetMachine } from '@/lib/validators/machine-fleet'
import type { Filament, ProductionJob } from '@/lib/validators/production'

import { CountTile } from './floor/count-tile'
import { FilamentTile } from './floor/filament-tile'
import { FleetTile } from './floor/fleet-tile'
import { FloorHeader } from './floor/floor-header'
import { PipelineCard } from './floor/pipeline-card'
import { RecentJobsTile } from './floor/recent-jobs-tile'
import { useFloorModel } from './floor/use-floor-model'

interface ProductionOverviewProps {
  brand: string
  brandLabel: string
  orders: OrderRecord[]
  jobs: ProductionJob[]
  batches: BatchRecord[]
  /** Seeded by the server render; the fleet slice then polls on its own. */
  initialFleetMachines: FleetMachine[]
  filaments: Filament[]
  recentJobs: RecentJob[]
}

/**
 * The production floor. Live: the pipeline, what needs attention, the printers
 * and filament stock. For the chosen period: orders, jobs and batches made,
 * and jobs packed. Only the fleet polls - status is the one thing here that
 * changes minute to minute, and refreshing six endpoints every ten seconds is
 * the load-generator failure mode AutoRefresh warns about.
 */
export function ProductionOverview(props: ProductionOverviewProps): JSX.Element {
  const { brand, brandLabel, orders, jobs, batches, filaments, recentJobs } = props
  const { data: fleet } = useFleetMachines(props.initialFleetMachines)
  const [period, setPeriod] = useState<PeriodValue>(DEFAULT_PERIOD)
  const range = useMemo(() => resolvePeriod(period, new Date()), [period])
  const inRange = useMemo(
    () => ({
      orders: orders.filter(o => isWithinDateRange(o.submittedAt, range)),
      jobs: jobs.filter(j => isWithinDateRange(j.created_at, range)),
      batches: batches.filter(b => isWithinDateRange(b.createdAt, range)),
    }),
    [orders, jobs, batches, range],
  )
  const model = useFloorModel({ jobs, batches, fleet, filaments, inRange })
  const base = `/dashboard/${brand}/production`

  return (
    <div className="flex flex-col gap-6">
      <FloorHeader
        brandLabel={brandLabel}
        actions={
          <>
            <OverviewDateRange value={period} onChange={setPeriod} />
            <PillLink href={`${base}/batches`} tone="lime" withArrow>
              Batches
            </PillLink>
          </>
        }
      />
      <PipelineCard
        stages={model.stages}
        bottleneck={model.bottleneck}
        attentionCount={model.attention.length}
        jobsHref={`${base}/jobs`}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
        <CountTile
          tone="lime"
          title="Orders received"
          counts={model.orders}
          link={{ href: `${base}/orders`, label: 'Open orders' }}
        />
        <CountTile
          tone="surface"
          title="Jobs created"
          counts={model.jobs}
          link={{ href: `${base}/jobs`, label: 'Open production jobs' }}
        />
        <CountTile
          tone="paper"
          title="Batches created"
          counts={model.batches}
          link={{ href: `${base}/batches`, label: 'Open batches' }}
        />
        <FilamentTile
          low={model.lowFilament}
          tracked={filaments.length}
          inventoryHref={`${base}/inventory`}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-4 [&>*]:min-w-0">
        <div className="xl:col-span-3">
          <FleetTile printers={model.fleet} machinesHref={`${base}/machines`} />
        </div>
        <AttentionTile items={model.attention} brandHref={`/dashboard/${brand}`} />
      </div>
      <RecentJobsTile jobs={recentJobs} jobsHref={`${base}/jobs`} />
    </div>
  )
}
