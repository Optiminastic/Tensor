import type { JSX } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Stat } from '@/components/ui/stat'
import type { DesignMetrics } from '@/lib/validators/designs'

interface DesignMetricsPanelProps {
  metrics: DesignMetrics
}

/** The physical facts the slicer produced, per unit after batching. */
export function DesignMetricsPanel({ metrics }: DesignMetricsPanelProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Slice metrics (per unit)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            label="Print time"
            value={`${metrics.effective_machine_time_hr.toFixed(2)} h`}
            hint="Effective, per unit"
          />
          <Stat
            label="Filament"
            value={`${metrics.filament_g.toFixed(1)} g`}
            hint={`${metrics.filament_length_mm.toFixed(0)} mm`}
          />
          <Stat label="Layer height" value={`${metrics.layer_height_mm.toFixed(2)} mm`} />
          <Stat
            label="Infill"
            value={`${metrics.infill_density_pct.toFixed(0)}%`}
            hint={`${metrics.wall_loops} walls`}
          />
          <Stat label="Units per bed" value={String(metrics.units_per_bed)} />
          <Stat
            label="Support"
            value={`${metrics.support_g.toFixed(1)} g`}
            hint={metrics.support_used ? 'Auto-generated' : 'None needed'}
          />
          <Stat
            label="Purge / waste"
            value={`${metrics.purge_g.toFixed(1)} g`}
            hint={`${metrics.colour_changes} colour change${
              metrics.colour_changes === 1 ? '' : 's'
            }`}
          />
        </div>
      </CardContent>
    </Card>
  )
}
