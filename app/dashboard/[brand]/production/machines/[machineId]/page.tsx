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

  let machine: FleetMachine
  let queuedBatches: BatchRecord[]
  // Enrichment, never a hard dependency: getFleetMachineLive returns null when
  // BambuBuddy is unreachable so the page still renders its scheduling state.
  let live: FleetMachineLive | null = null
  try {
    machine = await getFleetMachine(token, machineId)
    live = await getFleetMachineLive(token, machineId)
    queuedBatches = (await getFleetMachineQueue(token, machineId)).map(toBatchRecord)
  } catch {
    notFound()
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
      <FleetMachineDetailView
        brand={brand}
        machine={machine}
        queuedBatches={queuedBatches}
        live={live}
      />
    </main>
  )
}
