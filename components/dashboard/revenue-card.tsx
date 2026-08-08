import type { JSX } from 'react'

import { SegmentedBar } from '@/components/dashboard/segmented-bar'
import { Sparkline } from '@/components/dashboard/sparkline'
import { StatusLegend } from '@/components/dashboard/status-legend'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { WeekAmount } from '@/lib/dashboard/analytics'
import type { RevenueSummary } from '@/lib/dashboard/overview'
import { inr } from '@/lib/format'

interface RevenueCardProps {
  revenue: RevenueSummary
  trend: WeekAmount[]
}

interface FigureProps {
  label: string
  value: string
}

function Figure({ label, value }: FigureProps): JSX.Element {
  return (
    <div>
      <p className="text-subtle-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      <p className="text-foreground mt-1 font-mono text-lg tabular-nums">{value}</p>
    </div>
  )
}

/**
 * The hero revenue panel: total order value as the headline figure, a payment-status
 * split as a segmented bar, and orders / average-order-value as supporting figures.
 */
export function RevenueCard({ revenue, trend }: RevenueCardProps): JSX.Element {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Gross revenue</CardTitle>
        <CardDescription>Order value captured across this workspace.</CardDescription>
      </CardHeader>
      <div className="flex flex-1 flex-col gap-5 px-5 py-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="text-foreground font-mono text-5xl font-medium tracking-tight tabular-nums">
            {inr(revenue.total)}
          </p>
          <div className="flex gap-8">
            <Figure label="Orders" value={String(revenue.orderCount)} />
            <Figure label="Avg order" value={inr(revenue.averageOrderValue)} />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <p className="text-subtle-foreground text-[0.65rem] font-medium tracking-wide uppercase">
            Revenue, last 8 weeks
          </p>
          <div className="min-h-20 flex-1">
            <Sparkline data={trend} color="var(--accent)" />
          </div>
        </div>
        <SegmentedBar
          segments={revenue.segments}
          total={revenue.total}
          ariaLabel="Revenue by payment status"
        />
        <StatusLegend segments={revenue.segments} total={revenue.total} format={inr} />
      </div>
    </Card>
  )
}
