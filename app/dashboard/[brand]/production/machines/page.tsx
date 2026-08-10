import type { Metadata } from 'next'
import type { JSX } from 'react'

import { FleetMachineTable } from '@/components/production/fleet-machine-table'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
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
      <ProductionPageHeader
        title="Machine Management"
        description="Live status and print progress for every printer."
      />
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
