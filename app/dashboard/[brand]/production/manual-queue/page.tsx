/**
 * Pick the printer yourself, and see why the others were refused.
 *
 * Built as a local testing tool and gitignored, which was a mistake once the
 * Queue button was removed: that left the floor with NO manual way to put a bed
 * on a printer, and no way at all to read the dispatcher's reasoning. A bed
 * would sit saying "Not sent: ..." with one aggregated sentence, and the twelve
 * per-machine refusals behind it - the actual diagnosis - were computed on
 * every pass and shown to nobody.
 *
 * So it ships. Not as a second everyday send path: the Batches page has no
 * machine picker on purpose, because on a live floor the dialog asked somebody
 * to confirm an answer Tensor already had. This is the page you open when the
 * automatic answer is WRONG and you need to know why.
 *
 * It reads /batches/:id/queue-options and posts the machine_id + slot_trays the
 * backend has always accepted, so there is no backend change behind it.
 */
import { notFound } from 'next/navigation'

import { resolveBackendToken } from '@/lib/backend-token'
import { listBatches } from '@/services/batches.service'

import { ManualQueueList } from './manual-queue-list'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ brand: string }>
}

export default async function ManualQueuePage({ params }: PageProps): Promise<React.JSX.Element> {
  const { brand } = await params
  const { token } = await resolveBackendToken()
  if (!token) notFound()

  const batches = await listBatches(token)
  // A bed that is printing or printed has nothing to send, and one already in
  // BambuBuddy's queue must not be sent twice - the same rule the real button
  // follows.
  const sendable = batches.filter(b => {
    const waiting = b.status === 'open' || b.status === 'pending_approval'
    const notQueued = b.queue_item_id === null || b.queue_item_id === undefined
    return waiting && notQueued
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-display">Manual queue</h1>
        <p className="text-muted-foreground text-sm">
          Pick the printer yourself instead of letting Tensor choose — the machine list, the spool
          each plate slot prints from, and why each printer was refused.
        </p>
      </header>

      {sendable.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No bed is waiting to be sent. A bed shows here while it is a draft or locked, and
          disappears once it is queued.
        </p>
      ) : (
        <ManualQueueList brand={brand} batches={sendable} />
      )}
    </div>
  )
}
