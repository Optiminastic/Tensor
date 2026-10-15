import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import { SegmentedBar } from '@/components/dashboard/segmented-bar'
import { StatusLegend } from '@/components/dashboard/status-legend'
import type { StatusSegment } from '@/lib/dashboard/overview'

interface StatusTileProps {
  title: string
  unit: string
  segments: StatusSegment[]
  total: number
}

/**
 * A count split by status: one slim bar and its legend. The status colours
 * stay the dashboard's reserved status palette, and every segment is labelled.
 */
export function StatusTile({ title, unit, segments, total }: StatusTileProps): JSX.Element {
  return (
    <OverviewTile tone="paper" label={title}>
      <div className="flex items-baseline justify-between gap-3">
        <TileLabel>{title}</TileLabel>
        <p className="text-sm">
          <span className="font-medium tabular-nums">{total}</span> {unit}
        </p>
      </div>
      <SegmentedBar segments={segments} total={total} ariaLabel={`${title} by status`} />
      <StatusLegend segments={segments} total={total} />
    </OverviewTile>
  )
}
