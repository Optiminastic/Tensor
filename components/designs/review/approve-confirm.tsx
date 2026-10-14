import type { JSX } from 'react'

import { PillButton } from '@/components/landing/pill-button'
import { DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

import { FormError } from './form-error'

interface ApproveConfirmProps {
  title: string
  note: string
  onNoteChange: (note: string) => void
  pending: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}

/** The confirm step: what is being approved, an optional note, two pills. */
export function ApproveConfirm(props: ApproveConfirmProps): JSX.Element {
  const { title, note, onNoteChange, pending, error, onCancel, onConfirm } = props
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <DialogTitle className="text-2xl font-medium tracking-tight">{title}</DialogTitle>
        <DialogDescription>It becomes ready to publish to Shopify.</DialogDescription>
      </div>
      <Textarea
        rows={3}
        value={note}
        onChange={e => onNoteChange(e.target.value)}
        placeholder="A note for the timeline (optional)"
        aria-label="Approval note"
        className="rounded-2xl"
      />
      <FormError error={error} />
      <div className="flex items-center justify-end gap-3">
        <PillButton tone="outline" onClick={onCancel}>
          Cancel
        </PillButton>
        <PillButton tone="lime" withArrow disabled={pending} onClick={onConfirm}>
          {pending ? 'Approving...' : 'Confirm approval'}
        </PillButton>
      </div>
    </div>
  )
}
