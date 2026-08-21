import type { Metadata } from 'next'
import type { JSX } from 'react'

import { AutoRefresh } from '@/components/production/auto-refresh'
import { FleetMachineTable } from '@/components/production/fleet-machine-table'
import { FleetSyncButton } from '@/components/production/fleet-sync-button'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'
import type { FleetMachine } from '@/lib/validators/machine-fleet'
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
  }

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      {/* Nothing on this page polls: it is a server component fetched once.
          Only active when NEXT_PUBLIC_PRODUCTION_REFRESH_SECONDS is set, for
          watching an automated run. */}
      <AutoRefresh
        intervalSeconds={env.NEXT_PUBLIC_PRODUCTION_REFRESH_SECONDS}
        enabled={env.NEXT_PUBLIC_PRODUCTION_REFRESH_SECONDS !== undefined}
      />
      {/* The sync sits beside the header, matching the Orders page. Without it
          the fleet can only be populated by calling the API directly, which is
          why a fresh deployment showed an empty table with no way forward. */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ProductionPageHeader
          title="Machine Management"
          description="Live status and print progress for every printer."
        />
        <FleetSyncButton brand={brand} />
      </div>
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <FleetMachineTable brand={brand} machines={machines} />
      )}
    </main>
  )
}
