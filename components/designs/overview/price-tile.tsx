import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import { StatusPill } from '@/components/ui/status-pill'
import { inr, pct } from '@/lib/format'
import type { DesignPricing } from '@/lib/validators/designs'

import { ReviewCheck } from '../review/review-check'

interface PriceTileProps {
  pricing: DesignPricing
}

/** The headline: the price the ladder recommends, and whether it holds up. */
export function PriceTile({ pricing }: PriceTileProps): JSX.Element {
  return (
    <OverviewTile tone="lime" label="Recommended price" className="justify-between">
      <TileLabel>Recommended price</TileLabel>
      <div className="flex flex-col gap-2">
        <p className="text-5xl font-medium tracking-[-0.04em] tabular-nums">
          {pricing.recommended_sp !== null ? inr(pricing.recommended_sp) : '-'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={pricing.verdict} />
          <span className="font-mono text-xs tabular-nums opacity-75">
            CP {inr(pricing.design_cp, 2)} · {pct(pricing.cp_pct)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <ReviewCheck passed={pricing.passes_normal} label="Passes at 30% ad spend" onLime />
        <ReviewCheck passed={pricing.survives_stress} label="Survives the 40% stress test" onLime />
      </div>
    </OverviewTile>
  )
}
