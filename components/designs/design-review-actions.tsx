'use client'

import { useState, type JSX } from 'react'

import {
  approveDesignForBrand,
  rejectDesignForBrand,
  submitForReview,
} from '@/app/dashboard/[brand]/designs/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { DesignLifecycle, Verdict } from '@/lib/validators/designs'

export interface ReviewCaps {
  canSubmit: boolean
  canApprove: boolean
  canReject: boolean
}

interface DesignReviewActionsProps {
  brand: string
  designId: string
  status: DesignLifecycle
  verdict: Verdict | null
  caps: ReviewCaps
  onDone: () => void
}

function isSubmittable(status: DesignLifecycle, verdict: Verdict | null): boolean {
  // Matches the backend submit guard: only a priced design may be submitted for
  // review, and a Red design must be revised first (designs_review.go). A design
  // sent back (changes_requested) is re-sliced back to 'priced' before resubmit.
  return status === 'priced' && verdict !== 'red'
}

/** The Project Lead / Designer review actions for a design, gated by role and
 * status. Renders nothing when the caller has no applicable action. */
export function DesignReviewActions({
  brand,
  designId,
  status,
  verdict,
  caps,
  onDone,
}: DesignReviewActionsProps): JSX.Element | null {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showSubmit = caps.canSubmit && isSubmittable(status, verdict)
  const inReview = status === 'submitted'
  const showApprove = caps.canApprove && inReview
  const showReject = caps.canReject && inReview
  if (!showSubmit && !showApprove && !showReject) return null

  async function run(action: () => Promise<{ ok: boolean; error?: string }>): Promise<void> {
    setError(null)
    setPending(true)
    const outcome = await action()
    setPending(false)
    if (!outcome.ok) {
      setError(outcome.error ?? 'Something went wrong.')
      return
    }
    onDone()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {showSubmit ? (
          <Button
            variant="primary"
            size="sm"
            disabled={pending}
            onClick={() => void run(() => submitForReview(brand, designId))}
          >
            Submit for review
          </Button>
        ) : null}
        {showApprove ? (
          <Button
            variant="primary"
            size="sm"
            disabled={pending}
            onClick={() => void run(() => approveDesignForBrand(brand, designId))}
          >
            Approve
          </Button>
        ) : null}
        {showReject ? (
          <RejectDialog
            disabled={pending}
            onReject={comment => run(() => rejectDesignForBrand(brand, designId, comment))}
          />
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}

interface RejectDialogProps {
  disabled: boolean
  onReject: (comment: string) => Promise<void>
}

function RejectDialog({ disabled, onReject }: RejectDialogProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')

  async function submit(): Promise<void> {
    if (comment.trim().length === 0) return
    await onReject(comment.trim())
    setOpen(false)
    setComment('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="danger" size="sm" disabled={disabled}>
          Send back
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send back to the designer</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Textarea
            rows={4}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="What should the designer change?"
            aria-label="Reason for sending back"
          />
          <Button
            variant="danger"
            size="sm"
            className="self-start"
            disabled={comment.trim().length === 0}
            onClick={() => void submit()}
          >
            Send back
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
