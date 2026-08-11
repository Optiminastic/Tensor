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
    <main className="flex w-full flex-col gap-3 px-6 py-6 md:px-8">
      <Link
        href={`/dashboard/${brand}/production/machines`}
        aria-label="Back to Machine Management"
        className="text-muted-foreground hover:text-foreground hover:bg-surface-muted -ml-1.5 inline-flex w-fit items-center rounded-md p-1.5"
      >
        <ArrowLeft className="size-4" aria-hidden />
      </Link>
      <FleetMachineDetailView brand={brand} machine={machine} queuedBatches={queuedBatches} />
    </main>
  )
}
