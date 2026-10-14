import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import { pillClasses, type PillTone } from '@/components/ui/pill-shape'
import type { FailureRisk } from '@/lib/validators/designs'

const BANDS: Record<FailureRisk['band'], { label: string; tone: PillTone }> = {
  low: { label: 'Low', tone: 'success' },
  medium: { label: 'Medium', tone: 'warning' },
  high: { label: 'High', tone: 'danger' },
}

/** Advisory print-reliability signal from the slice metrics: a banded score plus
 * the factors that drove it (support, thin walls, overhang, waste). */
export function DesignFailureRisk({ risk }: { risk: FailureRisk }): JSX.Element {
  const band = BANDS[risk.band]
  return (
    <OverviewTile label="Failure risk" className="h-full">
      <div className="flex items-center justify-between gap-3">
        <TileLabel>Failure risk</TileLabel>
        <span className={pillClasses(band.tone)}>{band.label}</span>
      </div>
      <p className="text-4xl font-medium tracking-[-0.04em] tabular-nums">
        {risk.score}
        <span className="text-muted-foreground ml-1 text-lg">/ 100</span>
      </p>
      <ul className="flex flex-col gap-1.5">
        {risk.factors.map(factor => (
          <li key={factor} className="text-muted-foreground flex gap-2 text-sm">
            <span aria-hidden>·</span>
            <span>{factor}</span>
          </li>
        ))}
      </ul>
    </OverviewTile>
  )
}
