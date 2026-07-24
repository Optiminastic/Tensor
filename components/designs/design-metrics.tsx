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
          <Stat label="Supports" value={metrics.support_used ? 'Yes' : 'No'} />
        </div>
      </CardContent>
    </Card>
  )
}
