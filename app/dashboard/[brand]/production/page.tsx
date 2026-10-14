import type { Metadata } from 'next'
import type { JSX } from 'react'

import { isAllBrands } from '@/components/dashboard/nav-config'
import { toBatchRecord, toOrderRecord, toRecentJob } from '@/components/production/adapters'
import { FloorHeader } from '@/components/production/floor/floor-header'
import { ProductionOverview } from '@/components/production/production-overview'
import type { BatchRecord, OrderRecord } from '@/components/production/types'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { FleetMachine } from '@/lib/validators/machine-fleet'
import type { Filament, ProductionJob } from '@/lib/validators/production'
import { listBatches } from '@/services/batches.service'
import { listFleetMachines } from '@/services/machine-fleet.service'
import { listFilament, listOrders, listProductionJobs } from '@/services/production.service'

export const metadata: Metadata = { title: 'Production' }

interface ProductionPageProps {
  params: Promise<{ brand: string }>
}

export default async function ProductionPage({
  params,
}: ProductionPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('production:read', `/dashboard/${brand}`)

  let jobs: ProductionJob[] = []
  let orders: OrderRecord[] = []
  let batches: BatchRecord[] = []
  let fleetMachines: FleetMachine[] = []
  let filaments: Filament[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      const [j, rawOrders, rawBatches, fleet, filament] = await Promise.all([
        listProductionJobs(token),
        listOrders(token, 'live'),
        listBatches(token),
        listFleetMachines(token),
        listFilament(token),
      ])
      jobs = j
      orders = rawOrders.map(toOrderRecord)
      batches = rawBatches.map(toBatchRecord)
      fleetMachines = fleet
      filaments = filament
    } catch {
      error = 'Could not load production data. Is the backend running?'
    }
  }

  const brandLabel = isAllBrands(brand) ? 'All brands' : brand.replace(/-/g, ' ')
  return (
    <main className="flex w-full flex-col gap-8 px-4 py-10 sm:px-6 md:px-8">
      {error ? (
        <>
          <FloorHeader brandLabel={brandLabel} />
          <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
            {error}
          </p>
        </>
      ) : (
        <ProductionOverview
          brand={brand}
          brandLabel={brandLabel}
          orders={orders}
          jobs={jobs}
          batches={batches}
          initialFleetMachines={fleetMachines}
          filaments={filaments}
          recentJobs={jobs.slice(0, 8).map(toRecentJob)}
        />
      )}
    </main>
  )
}
