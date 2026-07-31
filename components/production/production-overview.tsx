import type { JSX } from 'react'

import { OverviewStats } from '@/components/dashboard/overview-stats'
import { MachinesPanel } from '@/components/production/machines-panel'
import { ProductionActivityChart } from '@/components/production/production-activity-chart'
import { RecentJobsTable } from '@/components/production/recent-jobs-table'
import {
  MACHINES,
  PRODUCTION_ACTIVITY,
  PRODUCTION_STATS,
  RECENT_JOBS,
} from '@/components/production/sample-data'

export function ProductionOverview(): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <OverviewStats stats={PRODUCTION_STATS} />
      <ProductionActivityChart data={PRODUCTION_ACTIVITY} />
      <div className="grid gap-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentJobsTable jobs={RECENT_JOBS} />
        </div>
        <MachinesPanel machines={MACHINES} />
      </div>
    </div>
  )
}
