'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX, type KeyboardEvent, type MouseEvent } from 'react'

import { FailureNote, failureRowClass } from '@/components/production/failure-note'
import { JobModelUploadButton } from '@/components/production/job-model-upload-button'
import { PriorityTag } from '@/components/production/priority-tag'
import {
  MODEL_STATUS_CONFIG,
  PACKAGING_STATUS_CONFIG,
  PERSONALISATION_STATUS_CONFIG,
  QUEUE_STATUS_CONFIG,
} from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { ProductionJobQueueItem } from '@/components/production/types'
import { TableCell, TableRow } from '@/components/ui/table'
import { dateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

interface JobQueueRowProps {
  brand: string
  job: ProductionJobQueueItem
}

function stopRowClick(event: MouseEvent): void {
  event.stopPropagation()
}

export function JobQueueRow({ brand, job }: JobQueueRowProps): JSX.Element {
  const router = useRouter()
  // Addressed by job number - the identifier a person can read back off a
  // plank or over the phone. The backend resolves either form.
  const href = `/dashboard/${brand}/production/jobs/${job.jobNumber}`

  const openDetail = (): void => router.push(href)
  const onKeyDown = (event: KeyboardEvent<HTMLTableRowElement>): void => {
    if (event.key === 'Enter') openDetail()
  }

  return (
    <TableRow
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={onKeyDown}
      className={cn(
        'cursor-pointer',
        // Red means "somebody has to do something". A render in flight does
        // not qualify, and painting every plank red for the twenty seconds it
        // takes is how red stops meaning anything.
        failureRowClass(job.modelStatus === 'failed' || Boolean(job.batchingBlockedReason)),
      )}
      aria-label={`Open ${job.id}`}
    >
      <TableCell className="font-mono text-sm whitespace-nowrap">
        {job.jobNumber}
        <FailureNote reason={job.batchingBlockedReason} className="mt-1 font-sans" />
      </TableCell>
      <TableCell>
        {job.description}
        {/* Which jobs are waiting on a person, and which on a render. A plank
            builds itself from the customer's names; everything else needs
            somebody to supply a model, and supplying it is the approval. */}
        <span className="mt-1 block">
          <TonePill {...MODEL_STATUS_CONFIG[job.modelStatus]} />
        </span>
        {/* "Oops" alone tells an operator something is wrong but not what.
            The renderer's own words are the only useful thing anyone has. */}
        <FailureNote reason={job.modelError} className="mt-1" />
      </TableCell>
      <TableCell numeric>{job.qty}</TableCell>
      <TableCell>
        <TonePill {...QUEUE_STATUS_CONFIG[job.status]} />
      </TableCell>
      <TableCell>
        <TonePill {...PERSONALISATION_STATUS_CONFIG[job.personalisation]} />
      </TableCell>
      <TableCell>
        <TonePill {...PACKAGING_STATUS_CONFIG[job.packaging]} />
      </TableCell>
      <TableCell className="text-right">
        <PriorityTag priority={job.priority} />
      </TableCell>
      <TableCell className="text-muted-foreground whitespace-nowrap">
        {dateTime(job.createdAt)}
      </TableCell>
      {/* One column for the model: where it is, and the one thing anyone can
          do about it. Hold and Start Production moved to the job's own Edit
          dialog - a clean job flows into a batch by itself, so those were
          controls for an exception being offered on every row. */}
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-1">
          {job.modelStatus === 'approval_required' ? (
            <JobModelUploadButton jobId={job.id} />
          ) : (
            <TonePill {...MODEL_STATUS_CONFIG[job.modelStatus]} />
          )}
          {/* "Oops" alone says something is wrong but not what. The renderer's
              own words are the only useful thing anyone has. */}
          <FailureNote reason={job.modelError} className="max-w-52 text-right" />
        </div>
      </TableCell>
    </TableRow>
  )
}
