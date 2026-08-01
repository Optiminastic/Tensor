import type { Metadata } from 'next'
import type { JSX } from 'react'

import { toMachineRecord } from '@/components/production/adapters'
import { MachineManagementTable } from '@/components/production/machine-management-table'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import type { MachineRecord } from '@/components/production/types'
import { resolveBackendToken } from '@/lib/backend-token'
import { MachineServiceError, listMachines } from '@/services/machines.service'

export const metadata: Metadata = { title: 'Machine Management' }

interface MachineManagementPageProps {
  params: Promise<{ brand: string }>
}

export default async function MachineManagementPage({
  params,
}: MachineManagementPageProps): Promise<JSX.Element> {
  const { brand } = await params

  let machines: MachineRecord[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      machines = (await listMachines(token)).map(toMachineRecord)
    } catch (err) {
      error = err instanceof MachineServiceError ? err.message : 'Could not load machines.'
    }
  }

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <ProductionPageHeader
        title="Machine Management"
        description="Add printers and keep their live status up to date."
      />
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <MachineManagementTable brand={brand} machines={machines} />
      )}
    </main>
  )
}
