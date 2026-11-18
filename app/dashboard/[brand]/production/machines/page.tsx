import type { Metadata } from 'next'
import type { JSX } from 'react'

import { toBatchRecord } from '@/components/production/adapters'
import { FleetSyncButton } from '@/components/production/fleet-sync-button'
import { MachineManagementTabs } from '@/components/production/machine-management-tabs'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import type { BatchRecord } from '@/components/production/types'
import { can, currentAuthz, requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { FleetMachine } from '@/lib/validators/machine-fleet'
import { listBatches } from '@/services/batches.service'
import { listFleetMachines, MachineFleetServiceError } from '@/services/machine-fleet.service'

export const metadata: Metadata = { title: 'Machine Management' }

interface MachineManagementPageProps {
  params: Promise<{ brand: string }>
}

export default async function MachineManagementPage({
  params,
}: MachineManagementPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('machine:read', `/dashboard/${brand}`)

  let machines: FleetMachine[] = []
  let batches: BatchRecord[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    // The fleet and the beds, in parallel. BambuBuddy's queue and history are
    // NOT read here: they go through the BambuBuddy tunnel (1-2 s on prod) and
    // only the Queued and History tabs use them, so MachineManagementTabs reads
    // them after the page has rendered (loadPrintActivity). The page used to
    // wait for all four, one after another - about 3 s before anything showed.
    //
    // Batches back the Queued tab and are their own permission: an operator who
    // may see machines but not batches gets an empty Queued list rather than a
    // page that fails to load, so a failure there is swallowed.
    const canReadBatches = can(await currentAuthz(), 'batch:read')
    const [fleet, beds] = await Promise.allSettled([
      listFleetMachines(token),
      canReadBatches ? listBatches(token) : Promise.resolve([]),
    ])
    if (fleet.status === 'fulfilled') {
      machines = fleet.value
    } else {
      error =
        fleet.reason instanceof MachineFleetServiceError
          ? fleet.reason.message
          : 'Could not load machines.'
    }
    batches = beds.status === 'fulfilled' ? beds.value.map(toBatchRecord) : []
  }

  return (
    <main className="flex w-full flex-col gap-8 px-4 py-10 sm:px-6 md:px-8">
      {/* The sync sits beside the header, matching the Orders page. Without it
          the fleet can only be populated by calling the API directly, which is
          why a fresh deployment showed an empty table with no way forward. */}
      <ProductionPageHeader
        title="Machine Management"
        description="What is queued, what is printing it, and what came off the bed."
        actions={<FleetSyncButton brand={brand} />}
      />
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      ) : (
        <MachineManagementTabs brand={brand} machines={machines} batches={batches} />
      )}
    </main>
  )
}
