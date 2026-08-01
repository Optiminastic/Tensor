import type { Metadata } from 'next'
import Link from 'next/link'
import type { JSX } from 'react'

import { MachineCostsView } from '@/components/machines/machine-costs-view'
import { can, currentAuthz } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { MachineCost } from '@/lib/validators/machines'
import { MachineServiceError, listMachinesWithCost } from '@/services/machines.service'

export const metadata: Metadata = { title: 'Machine Costs' }

/** The machine COST surface (config:manage). Separate from slicing config so
 * Operators - who edit machines but must never see cost - never load this. */
export default async function MachineCostsPage(): Promise<JSX.Element> {
  const authz = await currentAuthz()

  if (!can(authz, 'config:manage')) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <h1 className="text-display text-3xl">Machine Costs</h1>
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          You do not have access to machine costs.
        </p>
      </main>
    )
  }

  let machines: MachineCost[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      machines = await listMachinesWithCost(token)
    } catch (err) {
      error = err instanceof MachineServiceError ? err.message : 'Could not load machines.'
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-3xl">Machine Costs</h1>
        <p className="text-muted-foreground text-sm">
          Set the hourly cost for each machine. Slicing configuration lives on{' '}
          <Link className="text-accent hover:underline" href="/dashboard/machines">
            Machine Settings
          </Link>
          .
        </p>
      </div>

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <MachineCostsView machines={machines} />
      )}
    </main>
  )
}
