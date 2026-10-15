import type { JSX } from 'react'

import { PillButton } from '@/components/landing/pill-button'
import { DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

import { FormError } from './form-error'
import { ReasonChips } from './reason-chips'

interface SendBackFormProps {
  reasons: string[]
  onToggleReason: (reason: string) => void
  note: string
  onNoteChange: (note: string) => void
  pending: boolean
  canSend: boolean
  error: string | null
  onSend: () => void
}

/** Quick reasons plus a free note; sending needs at least one of the two. */
export function SendBackForm(props: SendBackFormProps): JSX.Element {
  const { reasons, onToggleReason, note, onNoteChange, pending, canSend, error, onSend } = props
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <DialogTitle className="text-2xl font-medium tracking-tight">
          Send back to the designer
        </DialogTitle>
        <DialogDescription>Pick what needs work, then add anything specific.</DialogDescription>
      </div>
      <ReasonChips selected={reasons} onToggle={onToggleReason} />
      <Textarea
        rows={4}
        value={note}
        onChange={e => onNoteChange(e.target.value)}
        placeholder="What should change?"
        aria-label="Note for the designer"
        className="rounded-2xl"
      />
      <FormError error={error} />
      <div className="flex justify-end">
        <PillButton tone="solid" disabled={pending || !canSend} onClick={onSend}>
          {pending ? 'Sending...' : 'Send back'}
        </PillButton>
      </div>
    </div>
  )
}
