'use client'

import { Trash2 } from 'lucide-react'
import { type JSX, useState } from 'react'

import { deleteDamageReportAction } from '@/app/dashboard/[brand]/agent/damaged-products/actions'
import { Button } from '@/components/ui/button'
import type { DamageReport } from '@/lib/validators/whatsapp-damage'

interface DamageDeleteControlProps {
  brand: string
  report: DamageReport
  canDelete: boolean
  onDeleted: () => void
}

/**
 * Removes a report and its history from the board.
 *
 * ADMIN ONLY, and separate from damage:resolve on purpose. Deciding what the
 * shop does about a complaint is the job; erasing the record that a customer
 * ever complained is not, so support who resolve reports all day do not get
 * this and will not see it.
 *
 * IT ASKS TWICE, and the second ask spells out what goes: the report, its
 * whole timeline, and the fact it ever existed. There is no undo and no
 * archive to fish it back out of. The photographs are the exception - they
 * hang off the upload link rather than the report and expire on their own.
 *
 * A BOOKED COURIER IS REFUSED, by the backend, which names the waybill to
 * cancel first. That refusal is shown as it arrives: deleting the row would
 * leave a van going to a customer's door with nothing in Tensor to say why.
 */
export function DamageDeleteControl({
  brand,
  report,
  canDelete,
  onDeleted,
}: DamageDeleteControlProps): JSX.Element | null {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canDelete) return null

  async function remove(): Promise<void> {
    setBusy(true)
    setError(null)
    const result = await deleteDamageReportAction({ brand, id: report.id })
    setBusy(false)
    if (!result.ok) {
      // The backend's own sentence. It names the waybill when a courier is
      // already booked, which is the thing to go and cancel.
      setError(result.error ?? 'That report could not be deleted.')
      setConfirming(false)
      return
    }
    onDeleted()
  }

  if (!confirming) {
    return (
      <div className="border-border mt-6 flex flex-col gap-2 border-t pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-subtle-foreground text-xs text-pretty">
            Remove this report and its timeline from the board.
          </p>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
            <Trash2 className="size-3" aria-hidden />
            Delete
          </Button>
        </div>
        {error ? (
          <p role="alert" className="text-danger text-xs text-pretty">
            {error}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="border-border mt-6 flex flex-col gap-2 border-t pt-4">
      <p className="text-danger text-sm font-medium">Delete this report?</p>
      <p className="text-subtle-foreground text-xs text-pretty">
        The report and every step of its timeline go for good — there is no undo. The
        customer&apos;s photographs are not deleted; they expire with the upload link on their own.
      </p>
      <div className="flex items-center gap-1.5">
        <Button variant="danger" size="sm" onClick={() => void remove()} disabled={busy}>
          {busy ? 'Deleting…' : 'Delete for good'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
