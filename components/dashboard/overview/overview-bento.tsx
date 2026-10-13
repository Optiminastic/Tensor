import type { JSX } from 'react'

import { ActivityTile } from '@/components/dashboard/overview/activity-tile'
import { AttentionTile } from '@/components/dashboard/overview/attention-tile'
import { CompletedTile } from '@/components/dashboard/overview/completed-tile'
import { RevenueTile } from '@/components/dashboard/overview/revenue-tile'
import { StatusTile } from '@/components/dashboard/overview/status-tile'
import { TopProductsTile } from '@/components/dashboard/overview/top-products-tile'
import type { OverviewModel } from '@/lib/dashboard/overview-model'

interface OverviewBentoProps {
  model: OverviewModel
  brandHref: string
}

/** The tiles under the sky card, in the landing page's bento rhythm. */
export function OverviewBento({ model, brandHref }: OverviewBentoProps): JSX.Element {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
      <RevenueTile revenue={model.revenue} trend={model.revenueTrend} delta={model.revenueDelta} />
      <div className="md:col-span-2">
        <ActivityTile
          data={model.activity}
          printHours={model.load.printHours}
          filamentKg={model.load.filamentKg}
        />
      </div>
      <div className="grid gap-4 [&>*]:min-w-0">
        <CompletedTile
          thisWeek={model.completedThisWeek}
          allTime={model.jobs.completed}
          delta={model.completedDelta}
        />
        <AttentionTile items={model.attention} brandHref={brandHref} />
      </div>
      <StatusTile
        title="Production jobs"
        unit="jobs"
        segments={model.jobs.segments}
        total={model.jobs.total}
      />
      <StatusTile
        title="Printer fleet"
        unit="printers"
        segments={model.machines.segments}
        total={model.machines.total}
      />
      <div className="md:col-span-2">
        <TopProductsTile products={model.products} />
      </div>
    </div>
  )
}
