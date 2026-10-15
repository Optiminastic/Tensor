import type { JSX } from 'react'

import { ActivityAreaChart } from '@/components/dashboard/activity-area-chart'
import { CHART_OLIVE, CHART_SKY } from '@/components/dashboard/overview/chart-colours'
import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import type { WeeklyPoint } from '@/lib/dashboard/analytics'

interface ActivityTileProps {
  data: WeeklyPoint[]
  printHours: number
  filamentKg: number
}

const SERIES = [
  { label: 'Created', color: 'bg-landing-chart-sky' },
  { label: 'Completed', color: 'bg-landing-chart-olive' },
]

/** Jobs created against jobs completed, eight weeks. Legend plus a hover tooltip. */
export function ActivityTile({ data, printHours, filamentKg }: ActivityTileProps): JSX.Element {
  return (
    <OverviewTile label="Production activity">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <TileLabel>Production activity</TileLabel>
        <p className="text-muted-foreground font-mono text-xs tabular-nums">
          {printHours.toFixed(0)}h queued · {filamentKg.toFixed(1)} kg
        </p>
      </div>
      <ul className="flex gap-5 text-sm" aria-label="Legend">
        {SERIES.map(s => (
          <li key={s.label} className="flex items-center gap-2">
            <span aria-hidden className={`h-1 w-4 rounded-full ${s.color}`} />
            {s.label}
          </li>
        ))}
      </ul>
      <div className="h-64">
        <ActivityAreaChart data={data} createdColor={CHART_SKY} completedColor={CHART_OLIVE} />
      </div>
    </OverviewTile>
  )
}
