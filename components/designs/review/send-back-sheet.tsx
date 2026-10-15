'use client'

import { Undo2 } from 'lucide-react'
import { useState, type JSX } from 'react'

import { rejectDesignForBrand } from '@/app/dashboard/[brand]/designs/actions'
import { PillButton } from '@/components/landing/pill-button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

import { sendBackComment } from './send-back-comment'
import { SendBackForm } from './send-back-form'

interface SendBackSheetProps {
  brand: string
  designId: string
  onDone: () => void
}

/** Send a design back: quick reasons plus a note, composed into one comment. */
export function SendBackSheet({ brand, designId, onDone }: SendBackSheetProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [reasons, setReasons] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const comment = sendBackComment(reasons, note)

  function toggle(reason: string): void {
    setReasons(current =>
      current.includes(reason) ? current.filter(r => r !== reason) : [...current, reason],
    )
  }

  async function send(): Promise<void> {
    setPending(true)
    setError(null)
    const result = await rejectDesignForBrand(brand, designId, comment)
    setPending(false)
    if (!result.ok) return setError(result.error ?? 'The design was not sent back.')
    setOpen(false)
    onDone()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <PillButton tone="outline">
          <Undo2 className="size-4" aria-hidden />
          Send back
        </PillButton>
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <SendBackForm
          reasons={reasons}
          onToggleReason={toggle}
          note={note}
          onNoteChange={setNote}
          pending={pending}
          canSend={comment.length > 0}
          error={error}
          onSend={() => void send()}
        />
      </DialogContent>
    </Dialog>
  )
}
