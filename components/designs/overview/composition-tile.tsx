import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import { inr, pct } from '@/lib/format'
import type { DesignPricing } from '@/lib/validators/designs'

import { type CostSegment, costSegments } from './cost-segments'

interface CompositionTileProps {
  pricing: DesignPricing
}

/** What the Design CP is made of: one stacked bar and its legend. */
export function CompositionTile({ pricing }: CompositionTileProps): JSX.Element {
  const segments = costSegments(pricing.breakdown)
  return (
    <OverviewTile label="What the cost is made of" className="h-full">
      <div className="flex items-baseline justify-between gap-3">
        <TileLabel>What the cost is made of</TileLabel>
        <span className="text-muted-foreground font-mono text-xs tabular-nums">
          {inr(pricing.design_cp, 2)}
        </span>
      </div>
      <CompositionBar segments={segments} />
      <ul className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {segments.map(segment => (
          <li key={segment.key} className="flex items-center gap-2 text-xs">
            {/* Data colour from the ramp: dynamic, so it cannot be a class. */}
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: segment.color }}
              aria-hidden
            />
            <span className="text-muted-foreground flex-1 truncate">{segment.label}</span>
            <span className="font-mono tabular-nums">{inr(segment.value, 2)}</span>
            <span className="text-muted-foreground w-11 text-right font-mono tabular-nums">
              {pct(segment.fraction)}
            </span>
          </li>
        ))}
      </ul>
    </OverviewTile>
  )
}

function CompositionBar({ segments }: { segments: CostSegment[] }): JSX.Element {
  return (
    <div className="flex h-4 w-full gap-1" role="img" aria-label="Design CP by cost component">
      {segments
        .filter(segment => segment.fraction > 0)
        .map(segment => (
          <span
            key={segment.key}
            className="h-full min-w-1 rounded-full"
            style={{ width: `${segment.fraction * 100}%`, background: segment.color }}
          />
        ))}
    </div>
  )
}
