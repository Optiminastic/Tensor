import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { JSX } from 'react'

import { toBatchRecord } from '@/components/production/adapters'
import { FleetMachineDetailView } from '@/components/production/fleet-machine-detail-view'
import type { BatchRecord } from '@/components/production/types'
import { resolveBackendToken } from '@/lib/backend-token'
import type { FleetMachine } from '@/lib/validators/machine-fleet'
import { getFleetMachineQueue } from '@/services/batches.service'
import { getFleetMachine } from '@/services/machine-fleet.service'

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
  try {
    machine = await getFleetMachine(token, machineId)
    queuedBatches = (await getFleetMachineQueue(token, machineId)).map(toBatchRecord)
  } catch {
    notFound()
  }

  return (
    <main className="flex w-full flex-col gap-6 px-6 py-10 md:px-8">
      <div className="flex flex-col gap-3">
        <Link
          href={`/dashboard/${brand}/production/machines`}
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Machine Management
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="text-display text-3xl">{machine.name}</h1>
          <p className="text-muted-foreground text-sm">Printer detail and live status.</p>
        </div>
      </div>
      <FleetMachineDetailView brand={brand} machine={machine} queuedBatches={queuedBatches} />
    </main>
  )
}
