'use client'

import { Pause, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX, type KeyboardEvent, type MouseEvent } from 'react'

import { updateProductionJob } from '@/app/dashboard/[brand]/production/actions'
import { PriorityTag } from '@/components/production/priority-tag'
import {
  PACKAGING_STATUS_CONFIG,
  PERSONALISATION_STATUS_CONFIG,
  QUEUE_STATUS_CONFIG,
} from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { ProductionJobQueueItem } from '@/components/production/types'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { dateTime } from '@/lib/format'

interface JobQueueRowProps {
  brand: string
  job: ProductionJobQueueItem
}

function stopRowClick(event: MouseEvent): void {
  event.stopPropagation()
}

export function JobQueueRow({ brand, job }: JobQueueRowProps): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const href = `/dashboard/${brand}/production/jobs/${job.id}`
  const onHold = job.status === 'on_hold'
  const canStart = job.status === 'queued'
  // A clean job (no validation issue, personalisation resolved) flows into a
  // batch automatically via the planner - manual Hold/Start controls are
  // only useful for a job stuck on something a human has to fix first.
  const needsManualAction = job.issueReason !== null || job.personalisation === 'required'

  const openDetail = (): void => router.push(href)
  const onKeyDown = (event: KeyboardEvent<HTMLTableRowElement>): void => {
    if (event.key === 'Enter') openDetail()
  }

  async function update(
    event: MouseEvent,
    input: { held?: boolean; status?: 'in_production' },
  ): Promise<void> {
    stopRowClick(event)
    setPending(true)
    setError(null)
    const res = await updateProductionJob(brand, job.id, input)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not update the job.')
      return
    }
    router.refresh()
  }

  return (
    <TableRow
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={onKeyDown}
      className="cursor-pointer"
      aria-label={`Open ${job.id}`}
    >
      <TableCell className="font-mono text-sm whitespace-nowrap">{job.jobNumber}</TableCell>
      <TableCell>{job.description}</TableCell>
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
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-1">
          {needsManualAction ? (
            <div className="flex justify-end gap-2" onClick={stopRowClick}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={event => void update(event, { held: !onHold })}
              >
                {onHold ? (
                  <Play className="size-3.5" aria-hidden />
                ) : (
                  <Pause className="size-3.5" aria-hidden />
                )}
                {onHold ? 'Resume' : 'Hold'}
              </Button>
              {canStart ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={pending}
                  onClick={event => void update(event, { status: 'in_production' })}
                >
                  Start Production
                </Button>
              ) : null}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">Auto-batching</span>
          )}
          {error ? (
            <p role="alert" className="text-danger text-xs">
              {error}
            </p>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  )
}
