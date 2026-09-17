'use client'

import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX, type KeyboardEvent } from 'react'

import { listBatchJobs } from '@/app/dashboard/[brand]/production/batch-jobs-actions'
import { BatchActionsMenu } from '@/components/production/batch-actions-menu'
import { BatchColourDots } from '@/components/production/batch-colour-dots'
import { BatchDoneDialog } from '@/components/production/batch-done-dialog'
import { batchFailure } from '@/components/production/batch-label'
import { BatchOrderTags } from '@/components/production/batch-order-tags'
import { BatchQueueButton } from '@/components/production/batch-queue-button'
import { BatchReprintDialog } from '@/components/production/batch-reprint-dialog'
import { FailureNote, failureRowClass } from '@/components/production/failure-note'
import { BATCH_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { BatchRecord } from '@/components/production/types'
import { TableCell, TableRow } from '@/components/ui/table'
import { countdown } from '@/lib/format'
import { cn } from '@/lib/utils'

interface BatchRowProps {
  brand: string
  batch: BatchRecord
}

export function BatchRow({ brand, batch }: BatchRowProps): JSX.Element {
  const router = useRouter()
  const [reprintJobs, setReprintJobs] = useState<
    { id: string; jobNumber: string; productName: string | null }[] | null
  >(null)
  const status = BATCH_STATUS_CONFIG[batch.status]
  const failure = batchFailure(batch)
  const href = `/dashboard/${brand}/production/batches/${batch.id}`

  const openDetail = (): void => router.push(href)

  async function loadJobsForReprint(): Promise<void> {
    const res = await listBatchJobs(batch.id)
    if (!res.ok || !res.data) return
    setReprintJobs(
      res.data.map(job => ({
        id: job.id,
        jobNumber: job.job_number,
        productName: job.product_name ?? null,
      })),
    )
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTableRowElement>): void => {
    if (event.key === 'Enter') openDetail()
  }

  return (
    <TableRow
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={onKeyDown}
      className={cn('cursor-pointer', failureRowClass(Boolean(failure)))}
      aria-label={`Open ${batch.batchNumber}`}
    >
      <TableCell className="font-mono text-sm">
        {batch.batchNumber}
        <FailureNote reason={failure?.reason} label={failure?.label} className="mt-1" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <TonePill label={status.label} tone={status.tone} />
          {batch.materialShortage ? (
            <span title="Filament shortage" className="text-warning">
              <AlertTriangle className="size-3.5" aria-hidden />
            </span>
          ) : null}
        </div>
      </TableCell>
      {/* The bed's filament colours. Placed before Jobs so the eye meets the
          colour first: under colour batching a bed IS a colour, and that is what
          decides which machine can take it. */}
      <TableCell className="py-2">
        <BatchColourDots colours={batch.colours} />
      </TableCell>
      {/* The orders on this bed, not a count.
          The count was the wrong answer to begin with - "which customers' work
          is on this plate?" is what someone at the printer is asking - and on
          the list it was not even shown: jobs_count is only ever set on the
          single-batch detail, so every row here rendered a dash. */}
      <TableCell className="py-2">
        <BatchOrderTags
          orderNumbers={batch.orderNumbers}
          priorityOrderNumbers={batch.priorityOrderNumbers}
        />
      </TableCell>
      <TableCell numeric>{batch.unitsPerBed ?? '—'}</TableCell>
      <TableCell numeric>
        {batch.totalPrintTimeMinutes !== null ? countdown(batch.totalPrintTimeMinutes * 60) : '—'}
      </TableCell>
      <TableCell numeric>
        {batch.totalFilamentGrams !== null ? `${Math.round(batch.totalFilamentGrams)} g` : '—'}
      </TableCell>
      <TableCell numeric>
        {batch.bedUtilizationPercent !== null ? `${batch.bedUtilizationPercent.toFixed(1)}%` : '—'}
      </TableCell>
      {/* Finishing a bed is done from the list, where the operator is looking at
          all of them, rather than only from inside one. The click must not also
          open the batch - the whole row is a link. */}
      <TableCell className="py-2 text-right">
        <div className="flex items-center justify-end gap-2">
          {/* Queueing belongs in the list for the same reason finishing does:
              the operator is looking at every bed at once and deciding which
              one goes next. Requiring them to open each bed to send it is what
              kept beds sitting locked and unsent. */}
          <BatchQueueButton
            brand={brand}
            batchId={batch.id}
            batchNumber={batch.batchNumber}
            status={batch.status}
            alreadyQueued={batch.queueItemId !== null}
            unitsPerBed={batch.unitsPerBed}
            compact
          />
          <BatchDoneDialog
            brand={brand}
            batchId={batch.id}
            batchNumber={batch.batchNumber}
            status={batch.status}
            stopPropagation
          />
          <BatchActionsMenu
            brand={brand}
            batchId={batch.id}
            batchNumber={batch.batchNumber}
            status={batch.status}
            onReprint={() => void loadJobsForReprint()}
          />
        </div>
        {/* Mounted once its jobs are loaded, and opened by that same act: the
            dialog cannot live inside the menu, which unmounts when an item is
            chosen. */}
        {reprintJobs ? (
          <BatchReprintDialog
            brand={brand}
            batchId={batch.id}
            batchNumber={batch.batchNumber}
            jobs={reprintJobs}
            defaultOpen
            onClosed={() => setReprintJobs(null)}
          />
        ) : null}
      </TableCell>
    </TableRow>
  )
}
