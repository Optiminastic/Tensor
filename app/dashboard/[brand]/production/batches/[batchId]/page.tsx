import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { JSX } from 'react'

import { toBatchRecord } from '@/components/production/adapters'
import { BatchApproveDialog } from '@/components/production/batch-approve-dialog'
import { BatchDetailView } from '@/components/production/batch-detail-view'
import { BatchEditDialog } from '@/components/production/batch-edit-dialog'
import type { BatchRecord } from '@/components/production/types'
import { resolveBackendToken } from '@/lib/backend-token'
import type { Machine } from '@/lib/validators/machines'
import type { ProductionJob } from '@/lib/validators/production'
import { getBatch } from '@/services/batches.service'
import { listMachines } from '@/services/machines.service'
import { listProductionJobsForBatch } from '@/services/production.service'

export const metadata: Metadata = { title: 'Batch' }

interface BatchPageProps {
  params: Promise<{ brand: string; batchId: string }>
}

export default async function BatchPage({ params }: BatchPageProps): Promise<JSX.Element> {
  const { brand, batchId } = await params
  const { token } = await resolveBackendToken()
  if (!token) notFound()

  let batch: BatchRecord
  let jobs: ProductionJob[]
  let machines: Machine[]
  try {
    batch = toBatchRecord(await getBatch(token, batchId))
    ;[jobs, machines] = await Promise.all([
      listProductionJobsForBatch(token, batchId),
      listMachines(token),
    ])
  } catch {
    notFound()
  }

  return (
    <main className="flex w-full flex-col gap-6 px-6 py-10 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-3">
          <Link
            href={`/dashboard/${brand}/production/batches`}
            className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to Batch Management
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-display text-3xl">Batch {batch.batchNumber}</h1>
            <p className="text-muted-foreground text-sm">Full batch detail.</p>
          </div>
        </div>
        {batch.status === 'pending_approval' ? (
          <BatchApproveDialog
            brand={brand}
            batchId={batch.id}
            assignedMachineId={batch.machineId}
            machines={machines}
          />
        ) : (
          <BatchEditDialog
            brand={brand}
            batchId={batch.id}
            status={batch.status}
            machineId={batch.machineId}
            machines={machines}
          />
        )}
      </div>
      <BatchDetailView brand={brand} batch={batch} jobs={jobs} machines={machines} />
    </main>
  )
}
