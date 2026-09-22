'use client'

import { Loader2, Printer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX, type MouseEvent } from 'react'

import { queueBatchToMachineAction } from '@/app/dashboard/[brand]/production/batch-jobs-actions'
import { Button } from '@/components/ui/button'
import type { BatchStatus } from '@/lib/validators/batches'

interface BatchQueueButtonProps {
  brand: string
  batchId: string
  status: BatchStatus
  /** True once the bed is in BambuBuddy's queue - it must not be sent twice. */
  alreadyQueued: boolean
  /** Tighter rendering for a dense table row. */
  compact?: boolean
}

/**
 * Sending a bed to print, in one press.
 *
 * There used to be a dialog here: pick a printer, bind each plate slot to a
 * spool, then send. It existed because Tensor could not tell which printer held
 * which colour, so the person who could see the spools had to say. It can now -
 * the colour map reconciles what a plate declares with what an AMS reports, and
 * the scheduler knows which printers are free - so asking again would be asking
 * somebody to confirm an answer Tensor already has.
 *
 * So the button sends nothing but the batch. The backend chooses the printer
 * that frees up soonest among those whose AMS actually holds this bed's
 * colours, binds the slots, slices for that machine and queues it there.
 *
 * When no printer can take the bed it refuses and says why - which colour is
 * unconfirmed, or which spool nobody has loaded. That is the one case a person
 * still has to act on, and it is a different action from choosing a machine.
 */
export function BatchQueueButton({
  brand,
  batchId,
  status,
  alreadyQueued,
  compact = false,
}: BatchQueueButtonProps): JSX.Element | null {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const isDraft = status === 'pending_approval'

  async function send(e: MouseEvent<HTMLButtonElement>): Promise<void> {
    // The row behind this is a link to the batch; queueing is not navigation.
    e.stopPropagation()
    setPending(true)
    setError('')

    // No machine and no slot binding: their absence is what asks Tensor to
    // decide. Sending a machine here would override that choice.
    const res = await queueBatchToMachineAction(brand, batchId, {})
    setPending(false)

    if (!res.ok || !res.data) {
      setError(res.error ?? 'Could not send this bed.')
      return
    }
    if (!res.data.queued) {
      setError(res.data.note)
      return
    }
    router.refresh()
  }

  // Nothing to queue on a printed bed, and nothing to queue twice. Rendering a
  // disabled control for a bed that is already printing says more than hiding
  // it: the row still shows why there is no button.
  if (status === 'completed') return null
  if (alreadyQueued || status === 'in_progress') {
    return (
      <div onClick={stopRowClick}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled
          title={alreadyQueued ? "Already in BambuBuddy's queue" : 'This bed is printing'}
        >
          <Printer className="size-3.5" aria-hidden />
          {status === 'in_progress' ? 'Printing' : 'Queued'}
        </Button>
      </div>
    )
  }

  return (
    <div
      onClick={stopRowClick}
      className={compact ? 'flex flex-col items-end gap-1' : 'flex flex-col gap-1'}
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={send}
        disabled={pending}
        // Locking reserves the bed's filament and cannot be undone by pressing
        // again, so the label says so before the press rather than after.
        title={
          isDraft
            ? 'Locks this bed, picks a printer and sends it'
            : 'Picks a printer and sends this bed'
        }
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Printer className="size-3.5" aria-hidden />
        )}
        {pending ? 'Sending…' : isDraft ? 'Lock & queue' : 'Queue'}
      </Button>
      {/* The refusal names the fix - a colour to confirm, a spool to load - so
          it is worth the room it takes in a dense row. */}
      {error ? (
        <p className="text-danger max-w-xs text-right text-xs" role="status">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function stopRowClick(e: MouseEvent<HTMLDivElement>): void {
  e.stopPropagation()
}
