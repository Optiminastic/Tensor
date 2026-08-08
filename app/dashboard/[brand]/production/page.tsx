import type { Metadata } from 'next'
import type { JSX } from 'react'

import {
  toBatchRecord,
  toMachineSummary,
  toOrderRecord,
  toRecentJob,
} from '@/components/production/adapters'
import { ProductionOverview } from '@/components/production/production-overview'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import type { BatchRecord, OrderRecord } from '@/components/production/types'
import { resolveBackendToken } from '@/lib/backend-token'
import type { FleetMachine } from '@/lib/validators/machine-fleet'
import type { Machine } from '@/lib/validators/machines'
import type { Filament, ProductionJob } from '@/lib/validators/production'
import { listBatches } from '@/services/batches.service'
import { listFleetMachines } from '@/services/machine-fleet.service'
import { listMachines } from '@/services/machines.service'
import { listFilament, listOrders, listProductionJobs } from '@/services/production.service'

export const metadata: Metadata = { title: 'Production' }

interface ProductionPageProps {
  params: Promise<{ brand: string }>
}

export default async function ProductionPage({
  params,
}: ProductionPageProps): Promise<JSX.Element> {
  const { brand } = await params

  let jobs: ProductionJob[] = []
  let orders: OrderRecord[] = []
  let batches: BatchRecord[] = []
  let fleetMachines: FleetMachine[] = []
  let filaments: Filament[] = []
  let machines: Machine[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      const [j, m, rawOrders, rawBatches, fleet, filament] = await Promise.all([
        listProductionJobs(token),
        listMachines(token),
        listOrders(token, 'live'),
        listBatches(token),
        listFleetMachines(token),
        listFilament(token),
      ])
      jobs = j
      machines = m
      orders = rawOrders.map(toOrderRecord)
      batches = rawBatches.map(toBatchRecord)
      fleetMachines = fleet
      filaments = filament
    } catch {
      error = 'Could not load production data. Is the backend running?'
    }
  }

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <ProductionPageHeader
        title="Production"
        description="Print queue, machines, and inventory at a glance."
      />
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <ProductionOverview
          brand={brand}
          orders={orders}
          jobs={jobs}
          batches={batches}
          fleetMachines={fleetMachines}
          filaments={filaments}
          recentJobs={jobs.slice(0, 8).map(toRecentJob)}
          machines={machines.map(toMachineSummary)}
        />
      )}
    </main>
  )
}
