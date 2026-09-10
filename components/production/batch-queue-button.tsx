'use client'

import { Printer } from 'lucide-react'
import { useState, type JSX, type MouseEvent } from 'react'

import { printBatchAction } from '@/app/dashboard/[brand]/production/batch-print-actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { BatchStatus } from '@/lib/validators/batches'

interface BatchQueueButtonProps {
  brand: string
  batchId: string
  batchNumber: string
  status: BatchStatus
  /** True once the bed is in BambuBuddy's queue - it must not be sent twice. */
  alreadyQueued: boolean
  /** How full the bed is, shown before locking a Draft. */
  unitsPerBed?: number | null
  /** Tighter, message-free rendering for a table row. */
  compact?: boolean
}

/**
 * Puts one bed on BambuBuddy's queue, because somebody pressed the button.
 *
 * Two things it is NOT. It is not the only way a bed reaches a printer - the
 * automatic dispatcher walks locked beds by itself - so this is the operator who
 * wants this bed printing now rather than at the next pass. And it is not
 * "Print": BambuBuddy's own dispatcher decides when the plate actually starts, so
 * a button promising that would claim something it cannot deliver.
 *
 * A Draft is locked on the way. That is the one irreversible half - it reserves
 * the bed's filament and stops the planner reshuffling it - which is why the
 * label says so, and why an under-full bed says how under-full before you press.
 */
export function queueButtonState(
  status: BatchStatus,
  alreadyQueued: boolean,
): { label: string; enabled: boolean; locks: boolean; title?: string } | null {
  if (alreadyQueued && (status === 'open' || status === 'in_progress')) {
    return {
      label: 'Queued',
      enabled: false,
      locks: false,
      title: "Already in BambuBuddy's queue",
    }
  }
  switch (status) {
    case 'pending_approval':
      return { label: 'Lock & queue', enabled: true, locks: true }
    case 'open':
      return { label: 'Queue', enabled: true, locks: false }
    case 'in_progress':
      return { label: 'Printing', enabled: false, locks: false, title: 'This bed is printing' }
    default:
      // Completed and anything else: there is nothing to queue.
      return null
  }
}

export function BatchQueueButton({
  brand,
  batchId,
  batchNumber,
  status,
  alreadyQueued,
  unitsPerBed,
  compact = false,
}: BatchQueueButtonProps): JSX.Element | null {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  // Locking is the irreversible half, so it takes two presses. An inline arm
  // rather than a dialog: this button lives in a dense table row as well as on
  // a detail page, and a modal per row is a modal nobody reads.
  const [armed, setArmed] = useState(false)

  const state = queueButtonState(status, alreadyQueued)
  if (!state) return null

  // The row itself navigates to the batch; the button must not.
  function stopRowClick(event: MouseEvent): void {
    event.stopPropagation()
  }

  async function send(): Promise<void> {
    // Locking reserves filament and stops the planner reshuffling the bed, and
    // an operator pressing this on a half-empty Draft has usually misread which
    // row they are on. Only that case arms; a locked bed is already committed.
    if (state?.locks && !armed) {
      setArmed(true)
      setFailed(false)
      setMessage(
        typeof unitsPerBed === 'number' && unitsPerBed > 0
          ? `Press again to lock ${batchNumber} with ${unitsPerBed} of 4 places filled.`
          : `Press again to lock ${batchNumber} and send it.`,
      )
      return
    }
    setArmed(false)

    setBusy(true)
    setMessage(null)
    setFailed(false)

    const result = await printBatchAction(brand, batchId)
    setBusy(false)

    if (!result.ok) {
      setFailed(true)
      setMessage(result.error ?? 'Could not send the batch to the printer.')
      return
    }
    const data = result.data
    if (!data) return

    // Already in BambuBuddy's library. Not an error - and specifically not
    // retried, because sending the same bed twice would print it twice.
    if (data.already_sent) {
      setFailed(true)
      setMessage(`${batchNumber} has already been sent to BambuBuddy.`)
      return
    }
    if (!data.queued) {
      // The bed may still have been LOCKED on the way, which is the half the
      // operator cannot undo - say so rather than reporting a plain failure.
      setFailed(true)
      setMessage(
        data.locked
          ? `${batchNumber} is locked, but no printer can take it yet: ${data.note}`
          : `${data.filename} reached BambuBuddy, but ${data.note}`,
      )
      return
    }
    setMessage(
      data.note
        ? `${batchNumber} queued — ${data.note}`
        : `${batchNumber} sent. It starts as soon as a printer is free.`,
    )
  }

  return (
    <div
      className={cn('flex flex-col gap-1', compact ? 'items-end' : 'items-start')}
      onClick={stopRowClick}
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={busy || !state.enabled}
        title={state.title}
        onClick={() => void send()}
      >
        <Printer className="size-3.5" aria-hidden />
        {busy ? 'Sending…' : armed ? 'Confirm lock' : state.label}
      </Button>
      {message ? (
        <p
          role="status"
          className={cn(
            'text-xs',
            failed ? 'text-danger' : 'text-muted-foreground',
            compact && 'max-w-52 text-right',
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
