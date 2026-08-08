import { headers } from 'next/headers'
import type { JSX } from 'react'

import { AttentionCard } from '@/components/dashboard/attention-card'
import { ProductionTrendCard } from '@/components/dashboard/production-trend-card'
import { RevenueCard } from '@/components/dashboard/revenue-card'
import { StatCard } from '@/components/dashboard/stat-card'
import { StatusBarCard } from '@/components/dashboard/status-bar-card'
import { TopProductsCard } from '@/components/dashboard/top-products-card'
import { getTokenSafe } from '@/lib/auth'
import {
  attentionItems,
  throughput,
  topProducts,
  weekOverWeekDelta,
  weeklyActivity,
  weeklyRevenue,
} from '@/lib/dashboard/analytics'
import { summariseJobs, summariseMachines, summariseRevenue } from '@/lib/dashboard/overview'
import { inr, pct } from '@/lib/format'
import type { Machine } from '@/lib/validators/machines'
import type { Order, ProductionJob } from '@/lib/validators/production'
import { listMachines } from '@/services/machines.service'
import { listOrders, listProductionJobs } from '@/services/production.service'

export const dynamic = 'force-dynamic'

interface BrandOverviewPageProps {
  params: Promise<{ brand: string }>
}

/**
 * The brand Overview: revenue, production trend, product mix, machine health and
 * jobs that need a human. Full-bleed and dense - it fills the workspace rather than
 * sitting in a centred column. Data is fetched and aggregated here (server) so the
 * client cards stay pure presentation; every list call fails soft to an empty array
 * so one unloadable source still leaves the rest with honest zero states.
 *
 * The production/orders/machine endpoints are workspace-wide today; brand-scoping
 * them is a tracked backend follow-up.
 */
export default async function BrandOverviewPage({
  params,
}: BrandOverviewPageProps): Promise<JSX.Element> {
  const { brand } = await params
  const token = (await getTokenSafe(await headers()))?.token ?? null

  const [orders, jobs, machines]: [Order[], ProductionJob[], Machine[]] = token
    ? await Promise.all([
        listOrders(token, 'live').catch(() => [] as Order[]),
        listProductionJobs(token).catch(() => [] as ProductionJob[]),
        listMachines(token).catch(() => [] as Machine[]),
      ])
    : [[], [], []]

  const revenue = summariseRevenue(orders)
  const jobsSummary = summariseJobs(jobs)
  const machinesSummary = summariseMachines(machines)
  const trend = weeklyActivity(jobs)
  const revenueTrend = weeklyRevenue(orders)
  const load = throughput(jobs)
  const products = topProducts(jobs)
  const attention = attentionItems(jobs)

  const revenueDelta = weekOverWeekDelta(revenueTrend.map(point => point.value))
  const completedDelta = weekOverWeekDelta(trend.map(point => point.completed))
  const completedThisWeek = trend[trend.length - 1]?.completed ?? 0

  return (
    <main className="flex w-full flex-col gap-4 px-6 py-8 lg:px-10">
      <header className="flex flex-col gap-1">
        <p className="text-subtle-foreground text-xs font-medium tracking-wide uppercase">
          {brand.replace(/-/g, ' ')}
        </p>
        <h1 className="text-display text-3xl">Overview</h1>
        <p className="text-muted-foreground text-sm">
          Revenue, production and machine health at a glance.
        </p>
      </header>

      <section aria-label="Headline metrics" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Gross revenue"
          value={inr(revenue.total)}
          hint={`${revenue.orderCount} orders`}
          accent="var(--accent)"
          delta={revenueDelta}
        />
        <StatCard
          label="Completed this week"
          value={String(completedThisWeek)}
          hint={`${jobsSummary.completed} all time`}
          accent="var(--success)"
          delta={completedDelta}
        />
        <StatCard
          label="In production"
          value={String(load.inProduction)}
          hint={`${jobsSummary.total} jobs total`}
          accent="var(--warning)"
        />
        <StatCard
          label="Machine use"
          value={pct(machinesSummary.utilisation)}
          hint={`${machinesSummary.active}/${machinesSummary.total} active`}
          accent="var(--border-strong)"
        />
      </section>

      <section aria-label="Revenue and production" className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <RevenueCard revenue={revenue} trend={revenueTrend} />
        </div>
        <div className="xl:col-span-2">
          <ProductionTrendCard
            data={trend}
            printHours={load.printHours}
            filamentKg={load.filamentKg}
          />
        </div>
      </section>

      <section aria-label="Pipeline and fleet" className="grid gap-4 lg:grid-cols-2">
        <StatusBarCard
          title="Production jobs"
          description="By run status."
          segments={jobsSummary.segments}
          total={jobsSummary.total}
          unit="jobs"
        />
        <StatusBarCard
          title="Machine fleet"
          description="Status right now."
          segments={machinesSummary.segments}
          total={machinesSummary.total}
          unit="machines"
        />
      </section>

      <section aria-label="Product mix and exceptions" className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TopProductsCard products={products} />
        </div>
        <div className="xl:col-span-1">
          <AttentionCard items={attention} />
        </div>
      </section>
    </main>
  )
}
