'use client'

import { Printer } from 'lucide-react'
import { useState, type JSX } from 'react'

import { printBatchAction } from '@/app/dashboard/[brand]/production/batch-print-actions'
import { Button } from '@/components/ui/button'

interface BatchPrintButtonProps {
  brand: string
  batchId: string
  batchNumber: string
  /** Whether the batch's merged plate has actually been sliced. */
  plateSliced: boolean
}

/**
 * Sends a locked batch's sliced plate to BambuBuddy's print queue.
 *
 * Only rendered for locked batches (see BatchDetailSheetContent): a Draft bed is
 * still being planned and the next planner pass can dissolve it, so committing
 * it to a machine would print a layout that no longer exists.
 *
 * The label says "Send to printer", not "Print". BambuBuddy's dispatcher decides
 * when the bed actually starts - a free printer of the right model picks it up
 * immediately, a busy one holds it - so a button promising "Print" would claim
 * something this cannot deliver.
 */
export function BatchPrintButton({
  brand,
  batchId,
  batchNumber,
  plateSliced,
}: BatchPrintButtonProps): JSX.Element {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  async function send(): Promise<void> {
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
      setFailed(true)
      setMessage(`${data.filename} reached BambuBuddy, but ${data.note}`)
      return
    }
    setMessage(
      data.note
        ? `${batchNumber} queued — ${data.note}`
        : `${batchNumber} sent. It starts as soon as a printer is free.`,
    )
  }

  // A batch whose plate was never sliced has no print file at all. Disabling
  // with the reason shown is kinder than letting the click fail server-side.
  if (!plateSliced) {
    return (
      <div className="flex flex-col items-start gap-1">
        <Button type="button" variant="secondary" size="sm" disabled>
          <Printer className="size-3.5" aria-hidden />
          Send to printer
        </Button>
        <p className="text-muted-foreground text-xs">
          The merged plate has not been sliced yet, so there is no print file to send.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={busy}
        onClick={() => void send()}
      >
        <Printer className="size-3.5" aria-hidden />
        {busy ? 'Sending…' : 'Send to printer'}
      </Button>
      {message ? (
        <p
          role="status"
          className={failed ? 'text-danger text-xs' : 'text-muted-foreground text-xs'}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
