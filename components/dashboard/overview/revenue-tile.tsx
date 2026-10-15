import type { JSX } from 'react'

import { CHART_SKY } from '@/components/dashboard/overview/chart-colours'
import { DeltaPill } from '@/components/dashboard/overview/delta-pill'
import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import { Sparkline } from '@/components/dashboard/sparkline'
import type { TrendDelta, WeekAmount } from '@/lib/dashboard/analytics'
import type { RevenueSummary } from '@/lib/dashboard/overview'
import { inr } from '@/lib/format'

interface RevenueTileProps {
  revenue: RevenueSummary
  trend: WeekAmount[]
  delta: TrendDelta | null
}

/** Gross revenue: the figure, its week-over-week change and eight weeks of shape. */
export function RevenueTile({ revenue, trend, delta }: RevenueTileProps): JSX.Element {
  return (
    <OverviewTile label="Gross revenue">
      <div className="flex items-start justify-between gap-3">
        <TileLabel>Gross revenue</TileLabel>
        <DeltaPill delta={delta} />
      </div>
      <p className="text-5xl font-medium tracking-[-0.04em] tabular-nums">{inr(revenue.total)}</p>
      <p className="text-muted-foreground text-sm">
        {revenue.orderCount} orders · {inr(revenue.averageOrderValue)} average
      </p>
      <div className="mt-auto h-20" aria-hidden>
        <Sparkline data={trend} color={CHART_SKY} />
      </div>
      <p className="text-muted-foreground font-mono text-[0.6875rem] tracking-wide uppercase">
        Last 8 weeks
      </p>
    </OverviewTile>
  )
}
