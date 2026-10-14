import type { JSX } from 'react'

import { RevenueTile } from '@/components/dashboard/overview/revenue-tile'
import { TopProductsTile } from '@/components/dashboard/overview/top-products-tile'
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

import { FigureTile } from './figure-tile'
import { PaymentSplitTile } from './payment-split-tile'

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
    <section aria-labelledby="sales-title" className="flex flex-col gap-4">
      <h2
        id="sales-title"
        className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase"
      >
        Sales · workspace-wide
      </h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
        <div className="md:col-span-2">
          <RevenueTile revenue={revenue} trend={trend} delta={revenueDelta} />
        </div>
        <FigureTile
          tone="lime"
          label="Avg order value"
          value={inr(revenue.averageOrderValue)}
          hint="Across every imported order"
        />
        <FigureTile
          tone="ink"
          label="Orders"
          value={String(revenue.orderCount)}
          hint="Imported from Shopify"
        />
        <div className="md:col-span-2">
          <PaymentSplitTile revenue={revenue} />
        </div>
        <div className="md:col-span-2">
          <TopProductsTile products={products} />
        </div>
      </div>
    </section>
  )
}
