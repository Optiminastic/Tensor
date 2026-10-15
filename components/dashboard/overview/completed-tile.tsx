import type { JSX } from 'react'

import { DeltaPill } from '@/components/dashboard/overview/delta-pill'
import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import type { TrendDelta } from '@/lib/dashboard/analytics'

interface CompletedTileProps {
  thisWeek: number
  allTime: number
  delta: TrendDelta | null
}

/** The lime tile: work finished this week. */
export function CompletedTile({ thisWeek, allTime, delta }: CompletedTileProps): JSX.Element {
  return (
    <OverviewTile tone="lime" label="Completed this week">
      <div className="flex items-start justify-between gap-3">
        <TileLabel>Completed this week</TileLabel>
        <DeltaPill delta={delta} onLime />
      </div>
      <p className="text-6xl font-medium tracking-[-0.04em] tabular-nums">{thisWeek}</p>
      <p className="mt-auto text-sm">{allTime} jobs completed all time.</p>
    </OverviewTile>
  )
}
