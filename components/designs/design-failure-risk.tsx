import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import { cn } from '@/lib/utils'
import type { FailureRisk } from '@/lib/validators/designs'

const BANDS: Record<FailureRisk['band'], { label: string; pill: string; dot: string }> = {
  low: { label: 'Low', pill: 'bg-success-subtle text-success', dot: 'bg-success' },
  medium: { label: 'Medium', pill: 'bg-warning-subtle text-warning', dot: 'bg-warning' },
  high: { label: 'High', pill: 'bg-danger-subtle text-danger', dot: 'bg-danger' },
}

/** Advisory print-reliability signal from the slice metrics: a banded score plus
 * the factors that drove it (support, thin walls, overhang, waste). */
export function DesignFailureRisk({ risk }: { risk: FailureRisk }): JSX.Element {
  const band = BANDS[risk.band]
  return (
    <OverviewTile label="Failure risk" className="h-full">
      <div className="flex items-center justify-between gap-3">
        <TileLabel>Failure risk</TileLabel>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
            band.pill,
          )}
        >
          <span className={cn('inline-block size-2 rounded-full', band.dot)} aria-hidden />
          {band.label}
        </span>
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
