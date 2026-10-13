import { headers } from 'next/headers'
import type { JSX } from 'react'

import { isAllBrands } from '@/components/dashboard/nav-config'
import { FloorCard } from '@/components/dashboard/overview/floor-card'
import { OverviewBento } from '@/components/dashboard/overview/overview-bento'
import { OverviewHeader } from '@/components/dashboard/overview/overview-header'
import { interTight } from '@/components/landing/landing-font'
import { getSessionSafe, getTokenSafe } from '@/lib/auth'
import { overviewModel } from '@/lib/dashboard/overview-model'
import type { Machine } from '@/lib/validators/machines'
import type { Order, ProductionJob } from '@/lib/validators/production'
import { listMachines } from '@/services/machines.service'
import { listOrders, listProductionJobs } from '@/services/production.service'

export const dynamic = 'force-dynamic'

interface BrandOverviewPageProps {
  params: Promise<{ brand: string }>
}

interface OverviewData {
  orders: Order[]
  jobs: ProductionJob[]
  machines: Machine[]
}

/** Every list fails soft to empty, so one unloadable source leaves honest zeros elsewhere. */
async function loadOverview(token: string | null): Promise<OverviewData> {
  if (!token) return { orders: [], jobs: [], machines: [] }
  const [orders, jobs, machines] = await Promise.all([
    listOrders(token, 'live').catch((): Order[] => []),
    listProductionJobs(token).catch((): ProductionJob[] => []),
    listMachines(token).catch((): Machine[] => []),
  ])
  return { orders, jobs, machines }
}

/**
 * The brand Overview, in the landing page's language: a greeting, the print
 * floor on a sky card, then a bento of revenue, activity, completions, what
 * needs a human, status splits and top products.
 *
 * The production/orders/machine endpoints are workspace-wide today; brand-scoping
 * them is a tracked backend follow-up.
 */
export default async function BrandOverviewPage({
  params,
}: BrandOverviewPageProps): Promise<JSX.Element> {
  const { brand } = await params
  const requestHeaders = await headers()
  const [token, session] = await Promise.all([
    getTokenSafe(requestHeaders),
    getSessionSafe(requestHeaders),
  ])
  const data = await loadOverview(token?.token ?? null)
  const model = overviewModel(data)
  const brandHref = `/dashboard/${brand}`
  const firstName = session?.user.name?.split(' ')[0] ?? null

  return (
    <main
      className={`${interTight.variable} font-landing flex w-full flex-col gap-4 px-4 py-8 sm:px-6 lg:px-10`}
    >
      <OverviewHeader
        brandLabel={isAllBrands(brand) ? 'All brands' : brand.replace(/-/g, ' ')}
        brandHref={brandHref}
        firstName={firstName}
      />
      <FloorCard
        inProduction={model.load.inProduction}
        busyPrinters={model.busyPrinters}
        totalPrinters={model.machines.total}
        completedThisWeek={model.completedThisWeek}
        machines={data.machines}
      />
      <OverviewBento model={model} brandHref={brandHref} />
    </main>
  )
}
