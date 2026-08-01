import type { JSX } from 'react'

import { type OverviewStat, OverviewStats } from '@/components/dashboard/overview-stats'
import { MachinesPanel } from '@/components/production/machines-panel'
import { RecentJobsTable } from '@/components/production/recent-jobs-table'
import type { MachineSummary, ProductionJob } from '@/components/production/types'

interface ProductionOverviewProps {
  stats: OverviewStat[]
  recentJobs: ProductionJob[]
  machines: MachineSummary[]
}

/** The production landing view: KPI tiles, recent jobs, and the machine carousel,
 * all from live data (the page fetches and passes them in). */
export function ProductionOverview({
  stats,
  recentJobs,
  machines,
}: ProductionOverviewProps): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <OverviewStats stats={stats} />
      <div className="grid gap-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentJobsTable jobs={recentJobs} />
        </div>
        <MachinesPanel machines={machines} />
      </div>
    </div>
  )
}
