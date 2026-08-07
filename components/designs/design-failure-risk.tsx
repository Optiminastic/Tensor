import type { JSX } from 'react'

import { Card, CardContent } from '@/components/ui/card'
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
    <Card>
      <CardContent>
        <div className="flex items-center justify-between gap-3">
          <p className="text-foreground text-sm font-medium">Failure risk</p>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
              band.pill,
            )}
          >
            <span className={cn('inline-block size-2 rounded-full', band.dot)} aria-hidden />
            {band.label} · <span className="font-mono tabular-nums">{risk.score}/100</span>
          </span>
        </div>
        <ul className="mt-3 flex flex-col gap-1.5">
          {risk.factors.map(factor => (
            <li key={factor} className="text-muted-foreground flex gap-2 text-sm">
              <span aria-hidden>·</span>
              <span>{factor}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
