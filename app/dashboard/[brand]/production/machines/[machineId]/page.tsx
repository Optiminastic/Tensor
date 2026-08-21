import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { JSX } from 'react'

import { toBatchRecord } from '@/components/production/adapters'
import { FleetMachineDetailView } from '@/components/production/fleet-machine-detail-view'
import type { BatchRecord } from '@/components/production/types'
import { resolveBackendToken } from '@/lib/backend-token'
import type { FleetMachine, FleetMachineLive } from '@/lib/validators/machine-fleet'
import { getFleetMachineQueue } from '@/services/batches.service'
import { getFleetMachine, getFleetMachineLive } from '@/services/machine-fleet.service'

export const metadata: Metadata = { title: 'Machine' }

interface MachinePageProps {
  params: Promise<{ brand: string; machineId: string }>
}

export default async function MachinePage({ params }: MachinePageProps): Promise<JSX.Element> {
  const { brand, machineId } = await params
  const { token } = await resolveBackendToken()
  if (!token) notFound()

  // The machine itself is the only hard dependency: if it cannot be loaded,
  // the page genuinely has nothing to be about, and 404 is honest.
  let machine: FleetMachine
  try {
    machine = await getFleetMachine(token, machineId)
  } catch {
    notFound()
  }

  // Everything below is enrichment and must not be able to 404 the page.
  //
  // All three calls used to share one try/catch, so a failing queue lookup -
  // a backend without the route, a Zod mismatch, a slow query - rendered
  // "This page doesn't exist" for a machine that plainly does exist. That is
  // the worst kind of error message: it sends the reader looking for a broken
  // link instead of a broken call. getFleetMachineLive already swallowed its
  // own errors and returned null; the queue did not, and that asymmetry was
  // invisible from the call site.
  const live: FleetMachineLive | null = await getFleetMachineLive(token, machineId)

  let queuedBatches: BatchRecord[] = []
  let queueError: string | null = null
  try {
    queuedBatches = (await getFleetMachineQueue(token, machineId)).map(toBatchRecord)
  } catch (err) {
    queueError =
      err instanceof Error ? err.message : 'Could not load the queued batches for this machine.'
  }

  // h-dvh + overflow-hidden makes this page exactly one viewport tall and
  // stops the document scrolling: the queue board below is the only thing that
  // scrolls, and it does so per column. Every wrapper between here and
  // BatchKanbanColumn has to carry min-h-0 with its flex-1, or a flex child
  // refuses to shrink under its content and the overflow escapes back out to
  // the page.
  return (
    <main className="flex h-dvh w-full flex-col gap-3 overflow-hidden px-6 py-6 md:px-8">
      <Link
        href={`/dashboard/${brand}/production/machines`}
        aria-label="Back to Machine Management"
        className="text-muted-foreground hover:text-foreground hover:bg-surface-muted -ml-1.5 inline-flex w-fit shrink-0 items-center rounded-md p-1.5"
      >
        <ArrowLeft className="size-4" aria-hidden />
      </Link>
      {/* Said out loud rather than shown as an empty board: "no queued batches"
          and "the queue could not be loaded" look identical otherwise. */}
      {queueError ? (
        <p
          role="alert"
          className="bg-danger-subtle text-danger shrink-0 rounded-md px-3 py-2 text-sm"
        >
          {queueError}
        </p>
      ) : null}
      <FleetMachineDetailView
        brand={brand}
        machine={machine}
        queuedBatches={queuedBatches}
        live={live}
      />
    </main>
  )
}
