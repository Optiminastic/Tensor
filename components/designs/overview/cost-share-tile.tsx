import { ArrowRight } from 'lucide-react'
import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import { pct } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DesignPricing, Verdict } from '@/lib/validators/designs'

// Status fills are reserved for the verdict, and always sit beside the
// StatusPill's word, so meaning never rides on colour alone.
const VERDICT_FILL: Record<Verdict, string> = {
  green: 'bg-success',
  yellow: 'bg-warning',
  red: 'bg-danger',
}

interface CostShareTileProps {
  pricing: DesignPricing
  onSeePricing: () => void
}

/** Cost as a share of the price, and why the verdict is what it is. */
export function CostShareTile({ pricing, onSeePricing }: CostShareTileProps): JSX.Element {
  const cost = Math.min(1, Math.max(0, pricing.cp_pct))
  return (
    <OverviewTile label="Cost share of price">
      <TileLabel>Cost share of price</TileLabel>
      <p className="text-4xl font-medium tracking-[-0.04em] tabular-nums">{pct(pricing.cp_pct)}</p>
      <div
        className="bg-surface-muted flex h-4 w-full overflow-hidden rounded-full"
        role="img"
        aria-label={`Cost ${pct(cost)}, headroom ${pct(1 - cost)}`}
      >
        <span
          className={cn('h-full rounded-full', VERDICT_FILL[pricing.verdict])}
          style={{ width: `${cost * 100}%` }}
        />
      </div>
      {pricing.reasons.length > 0 ? (
        <ul className="text-muted-foreground flex list-disc flex-col gap-1 pl-5 text-sm">
          {pricing.reasons.map(reason => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          This design meets the brand&apos;s cost target.
        </p>
      )}
      <button
        type="button"
        onClick={onSeePricing}
        className="text-foreground mt-auto inline-flex items-center gap-1.5 self-start text-sm font-medium underline-offset-4 hover:underline"
      >
        See the full breakdown
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </OverviewTile>
  )
}
