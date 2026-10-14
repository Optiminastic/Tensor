import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import type { DesignMetrics } from '@/lib/validators/designs'

import { TileFigure } from './tile-figure'

const MM_PER_M = 1000

interface SliceFactsTileProps {
  metrics: DesignMetrics
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** The physical facts the slicer produced, per unit after batching. */
export function SliceFactsTile({ metrics }: SliceFactsTileProps): JSX.Element {
  return (
    <OverviewTile tone="paper" label="From the slicer" className="h-full">
      <TileLabel>From the slicer, per unit</TileLabel>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
        <TileFigure
          label="Filament"
          value={`${metrics.filament_g.toFixed(1)} g`}
          hint={`${(metrics.filament_length_mm / MM_PER_M).toFixed(1)} m`}
        />
        <TileFigure
          label="Support"
          value={`${metrics.support_g.toFixed(1)} g`}
          hint={metrics.support_used ? 'Auto-generated' : 'None needed'}
        />
        <TileFigure
          label="Purge and waste"
          value={`${metrics.purge_g.toFixed(1)} g`}
          hint={plural(metrics.colour_changes, 'colour change')}
        />
        <TileFigure label="Layer height" value={`${metrics.layer_height_mm.toFixed(2)} mm`} />
        <TileFigure
          label="Infill"
          value={`${metrics.infill_density_pct.toFixed(0)}%`}
          hint={plural(metrics.wall_loops, 'wall')}
        />
        <TileFigure label="Electricity" value={`${metrics.electricity_kwh.toFixed(2)} kWh`} />
      </div>
    </OverviewTile>
  )
}
