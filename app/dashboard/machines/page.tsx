import type { Metadata } from 'next'
import Link from 'next/link'
import type { JSX } from 'react'

import { MachinesView } from '@/components/machines/machines-view'
import { can, currentAuthz } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { Machine } from '@/lib/validators/machines'
import { MachineServiceError, listMachines } from '@/services/machines.service'

export const metadata: Metadata = { title: 'Machine Settings' }

/** Configure each machine's slicing profile: nozzle, supported filaments and the
 * layer-height range a design can be sliced with. Cost lives on its own surface. */
export default async function MachinesPage(): Promise<JSX.Element> {
  const authz = await currentAuthz()
  const canManage = can(authz, 'machine:manage')

  let machines: Machine[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      machines = await listMachines(token)
    } catch (err) {
      error = err instanceof MachineServiceError ? err.message : 'Could not load machines.'
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-3xl">Machine Settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure each machine: its nozzle, supported filaments and the layer-height range designs
          can be sliced with. Hourly cost is set on{' '}
          <Link className="text-accent hover:underline" href="/dashboard/machines/cost">
            Machine Costs
          </Link>
          .
        </p>
      </div>

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <MachinesView machines={machines} canManage={canManage} />
      )}
    </main>
  )
}
