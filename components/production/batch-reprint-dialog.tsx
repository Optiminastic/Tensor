'use client'

import { RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { reprintBatch } from '@/app/dashboard/[brand]/production/batch-jobs-actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FAILURE_REASONS } from '@/lib/validators/production'

// The backend's fixed taxonomy, in operator words. Kept in step with
// reprint-dialog.tsx, which offers the same list for a single plank.
const REASON_LABELS: Record<(typeof FAILURE_REASONS)[number], string> = {
  bed_adhesion: 'Bed adhesion',
  warping: 'Warping',
  layer_shift: 'Layer shift',
  filament_issue: 'Filament issue',
  colour_issue: 'Colour issue',
  support_failure: 'Support failure',
  power_issue: 'Power issue',
  machine_error: 'Machine error',
  wrong_personalisation: 'Wrong personalisation',
  design_issue: 'Design issue',
  operator_error: 'Operator error',
  other: 'Other',
}

/**
 * Reprints chosen planks off a finished bed onto a new locked one.
 *
 * A selection rather than the whole bed, because a bed is rarely wholly wrong:
 * of the four planks that prompted this, three were correct and reprinting them
 * would have been hours of filament nobody needed.
 *
 * One reason for the selection, not one per plank - they came off a single plate
 * in a single state, and a per-plank reason is a form nobody fills in honestly.
 *
 * The reprints land together on one new batch, locked and ready to send, which
 * is the difference from reprinting each plank on its own: those clones would be
 * scattered across whatever beds the planner built next.
 */
interface BatchReprintDialogProps {
  brand: string
  batchId: string
  batchNumber: string
  jobs: { id: string; jobNumber: string; productName: string | null }[]
  /**
   * Opens on mount, for a caller that has already decided - the batch list's
   * actions menu, which loads the bed's jobs precisely because reprint was
   * chosen. Elsewhere the trigger is the way in.
   */
  defaultOpen?: boolean
  /** Lets such a caller drop the dialog again once it closes. */
  onClosed?: () => void
}

export function BatchReprintDialog({
  brand,
  batchId,
  batchNumber,
  jobs,
  defaultOpen = false,
  onClosed,
}: BatchReprintDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(defaultOpen)
  const [picked, setPicked] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function toggle(jobId: string): void {
    setPicked(current =>
      current.includes(jobId) ? current.filter(id => id !== jobId) : [...current, jobId],
    )
  }

  async function submit(): Promise<void> {
    setError(null)
    if (picked.length === 0) {
      setError('Pick at least one plank to reprint.')
      return
    }
    if (!reason) {
      setError('Pick a reason for the reprint.')
      return
    }
    setPending(true)
    const res = await reprintBatch(brand, batchId, {
      job_ids: picked,
      reason,
      notes: notes.trim() || null,
    })
    setPending(false)

    if (!res.ok || !res.data) {
      setError(res.error ?? 'Could not reprint these planks.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (!next) onClosed?.()
        if (next) {
          setPicked([])
          setReason('')
          setNotes('')
          setError(null)
        }
      }}
    >
      {defaultOpen ? null : (
        <DialogTrigger asChild>
          <Button variant="secondary" size="sm">
            <RotateCcw className="size-3.5" aria-hidden />
            Reprint planks
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reprint from {batchNumber}</DialogTitle>
          <DialogDescription>
            The planks you pick are marked failed and replaced by fresh jobs at urgent priority, all
            on one new locked batch ready to send.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Planks" htmlFor="reprint-jobs" required>
            <div
              id="reprint-jobs"
              className="border-border flex flex-col gap-1 rounded-md border p-2"
            >
              {jobs.map(job => (
                <label
                  key={job.id}
                  className="hover:bg-surface-muted flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={picked.includes(job.id)}
                    onChange={() => toggle(job.id)}
                  />
                  <span className="font-mono tabular-nums">{job.jobNumber}</span>
                  <span className="text-muted-foreground truncate">{job.productName ?? ''}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Reason" htmlFor="batch-reprint-reason" required>
            <Select
              id="batch-reprint-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              aria-label="Reprint reason"
            >
              <option value="">Why are these being reprinted?</option>
              {FAILURE_REASONS.map(value => (
                <option key={value} value={value}>
                  {REASON_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notes" htmlFor="batch-reprint-notes" hint="Optional">
            <Textarea
              id="batch-reprint-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </Field>
          {error ? (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          ) : null}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              {picked.length} of {jobs.length} selected
            </p>
            <Button size="sm" disabled={pending} onClick={() => void submit()}>
              {pending ? 'Reprinting…' : 'Reprint onto a new batch'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
