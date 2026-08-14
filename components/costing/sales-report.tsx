import type { JSX } from 'react'

import { RevenueCard } from '@/components/dashboard/revenue-card'
import { StatCard } from '@/components/dashboard/stat-card'
import { TopProductsCard } from '@/components/dashboard/top-products-card'
import { resolveBackendToken } from '@/lib/backend-token'
import {
  type TopProduct,
  type WeekAmount,
  topProducts,
  weekOverWeekDelta,
  weeklyRevenue,
} from '@/lib/dashboard/analytics'
import { type RevenueSummary, summariseRevenue } from '@/lib/dashboard/overview'
import { inr } from '@/lib/format'
import type { Order, ProductionJob } from '@/lib/validators/production'
import { listOrders, listProductionJobs } from '@/services/production.service'

interface SalesData {
  revenue: RevenueSummary
  trend: WeekAmount[]
  products: TopProduct[]
}

/**
 * The Shopify sales summary on the Cost Reports page: gross revenue, average
 * order value, the revenue trend, and the best-selling products - all from
 * imported orders and their production jobs, never invented. Orders are
 * workspace-wide today (no brand link), so this section is labelled as such.
 */
export async function SalesReport(): Promise<JSX.Element> {
  const { token } = await resolveBackendToken()
  const [orders, jobs]: [Order[], ProductionJob[]] = token
    ? await Promise.all([
        listOrders(token, 'live').catch(() => [] as Order[]),
        listProductionJobs(token).catch(() => [] as ProductionJob[]),
      ])
    : [[], []]

  const revenue = summariseRevenue(orders)
  const trend = weeklyRevenue(orders)
  return <SalesReportView data={{ revenue, trend, products: topProducts(jobs) }} />
}

function SalesReportView({ data }: { data: SalesData }): JSX.Element {
  const { revenue, trend, products } = data
  const revenueDelta = weekOverWeekDelta(trend.map(point => point.value))
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-foreground text-lg font-medium">Sales</h2>
        <span className="text-subtle-foreground text-xs tracking-wide uppercase">
          Workspace-wide
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard
          label="Gross revenue"
          value={inr(revenue.total)}
          hint={`${revenue.orderCount} orders`}
          accent="var(--accent)"
          delta={revenueDelta}
        />
        <StatCard
          label="Avg order value"
          value={inr(revenue.averageOrderValue)}
          accent="var(--success)"
        />
        <StatCard label="Orders" value={String(revenue.orderCount)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueCard revenue={revenue} trend={trend} />
        <TopProductsCard products={products} />
      </div>
    </section>
  )
}
