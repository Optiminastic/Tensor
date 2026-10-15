'use client'

import { useState, type JSX } from 'react'

import { addDesignComment, approveDesignForBrand } from '@/app/dashboard/[brand]/designs/actions'
import { PillButton } from '@/components/landing/pill-button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { inr } from '@/lib/format'

import { ApproveConfirm } from './approve-confirm'
import { ApproveSuccess } from './approve-success'

interface ApproveSheetProps {
  brand: string
  designId: string
  designName: string
  price: number | null
  onDone: () => void
}

/**
 * Approve, as a deliberate step: what is approved and at what price, an
 * optional note that lands on the review timeline, then a confirmation. The
 * price is the recommended one; the backend applies the same default.
 */
export function ApproveSheet(props: ApproveSheetProps): JSX.Element {
  const { brand, designId, designName, price, onDone } = props
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [approved, setApproved] = useState(false)
  const priceLabel = price !== null ? ` at ${inr(price)}` : ''

  async function confirm(): Promise<void> {
    setPending(true)
    setError(null)
    const result = await approveDesignForBrand(brand, designId)
    if (result.ok && note.trim()) await addDesignComment(designId, note.trim())
    setPending(false)
    if (!result.ok) setError(result.error ?? 'The design was not approved.')
    else setApproved(true)
  }

  // Refresh only once the dialog closes: refetching while it is open would
  // unmount this panel (the design is no longer "submitted") mid-celebration.
  function finish(): void {
    setOpen(false)
    onDone()
  }

  return (
    <Dialog open={open} onOpenChange={next => (approved ? finish() : setOpen(next))}>
      <DialogTrigger asChild>
        <PillButton tone="lime" withArrow>{`Approve${priceLabel}`}</PillButton>
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        {approved ? (
          <ApproveSuccess designName={designName} onDone={finish} />
        ) : (
          <ApproveConfirm
            title={`Approve ${designName}${priceLabel}?`}
            note={note}
            onNoteChange={setNote}
            pending={pending}
            error={error}
            onCancel={() => setOpen(false)}
            onConfirm={() => void confirm()}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
