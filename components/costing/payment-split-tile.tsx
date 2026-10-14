import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import { SegmentedBar } from '@/components/dashboard/segmented-bar'
import { StatusLegend } from '@/components/dashboard/status-legend'
import type { RevenueSummary } from '@/lib/dashboard/overview'
import { inr } from '@/lib/format'

interface PaymentSplitTileProps {
  revenue: RevenueSummary
}

/** Where the revenue stands: paid, still pending, and refunded or other. */
export function PaymentSplitTile({ revenue }: PaymentSplitTileProps): JSX.Element {
  return (
    <OverviewTile tone="paper" label="Revenue by payment" className="h-full">
      <TileLabel>Revenue by payment</TileLabel>
      <SegmentedBar
        segments={revenue.segments}
        total={revenue.total}
        ariaLabel="Revenue by payment status"
      />
      <StatusLegend segments={revenue.segments} total={revenue.total} format={inr} />
    </OverviewTile>
  )
}
