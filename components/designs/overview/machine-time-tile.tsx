import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import type { DesignMetrics } from '@/lib/validators/designs'

interface MachineTimeTileProps {
  metrics: DesignMetrics
}

/** Machine time per unit after batching, against the whole plate it shares. */
export function MachineTimeTile({ metrics }: MachineTimeTileProps): JSX.Element {
  return (
    <OverviewTile tone="ink" label="Machine time per unit" className="justify-between">
      <TileLabel>Machine time per unit</TileLabel>
      <p className="text-5xl font-medium tracking-[-0.04em] tabular-nums">
        {metrics.effective_machine_time_hr.toFixed(2)}
        <span className="ml-1 text-2xl opacity-70">h</span>
      </p>
      <p className="text-sm tabular-nums opacity-75">
        {metrics.print_time_hr.toFixed(2)} h for a plate of {metrics.units_per_bed}
      </p>
    </OverviewTile>
  )
}
