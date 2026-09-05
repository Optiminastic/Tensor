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
import type { QueueItem } from '@/lib/validators/print-queue'
import { listBatches } from '@/services/batches.service'
import {
  listFleetMachines,
  listPrintQueue,
  MachineFleetServiceError,
} from '@/services/machine-fleet.service'

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
  let queue: QueueItem[] = []
  let queueError: string | null = null
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      machines = await listFleetMachines(token)
    } catch (err) {
      error = err instanceof MachineFleetServiceError ? err.message : 'Could not load machines.'
    }
    // Batches back the Queued and History tabs. Read separately because
    // batch:read is its own permission - an operator who may see machines but
    // not batches gets the Machines tab and two empty ones, rather than a page
    // that fails to load. A failure here is swallowed for the same reason: the
    // fleet is the page's reason for existing and must still render.
    if (can(await currentAuthz(), 'batch:read')) {
      try {
        batches = (await listBatches(token)).map(toBatchRecord)
      } catch {
        batches = []
      }
    }
    // Read through to BambuBuddy, so this is the one part of the page that
    // depends on the tunnel being up. Its failure is carried to the Queued tab
    // rather than failing the page: the fleet and history still render, and
    // the tab says it could not reach BambuBuddy instead of showing an empty
    // list that reads as "nothing queued".
    try {
      queue = await listPrintQueue(token)
    } catch (err) {
      queueError =
        err instanceof MachineFleetServiceError
          ? err.message
          : 'Could not reach BambuBuddy to read the print queue.'
    }
  }

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      {/* The sync sits beside the header, matching the Orders page. Without it
          the fleet can only be populated by calling the API directly, which is
          why a fresh deployment showed an empty table with no way forward. */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ProductionPageHeader
          title="Machine Management"
          description="What is queued, what is printing it, and what came off the bed."
        />
        <FleetSyncButton brand={brand} />
      </div>
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <MachineManagementTabs
          brand={brand}
          machines={machines}
          batches={batches}
          queue={queue}
          queueError={queueError}
        />
      )}
    </main>
  )
}
