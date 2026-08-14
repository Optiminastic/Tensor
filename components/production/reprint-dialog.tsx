'use client'

import { Download, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { reprintJob } from '@/app/dashboard/[brand]/production/batch-jobs-actions'
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

// The backend's fixed taxonomy, given operator-readable labels.
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

interface ReprintDialogProps {
  brand: string
  job: { id: string; jobNumber: string; productName: string | null; printFileID: string | null }
}

/** Queues a reprint of one job off the completed-batch board. A reprint goes
 * through /fail, so it always records why: the backend clones the job at
 * urgent priority and returns the new job number. The print file shown is the
 * STL this job was sliced from - a design carries exactly one, and the reprint
 * uses that same file. */
export function ReprintDialog({ brand, job }: ReprintDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(): Promise<void> {
    setError(null)
    if (!reason) {
      setError('Pick a reason for the reprint.')
      return
    }
    setPending(true)
    const res = await reprintJob(brand, job.id, { reason, notes: notes.trim() || null })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not queue the reprint.')
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
        if (next) {
          setReason('')
          setNotes('')
          setError(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <RotateCcw className="size-3.5" aria-hidden />
          Reprint
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reprint — {job.jobNumber}</DialogTitle>
          <DialogDescription>
            Queues a fresh job at urgent priority from the same STL. This job is marked failed with
            the reason below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Print file" htmlFor="reprint-file">
            <div
              id="reprint-file"
              className="border-border bg-surface-muted flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground truncate">
                {job.productName ?? 'This product'}
                {job.printFileID ? '' : ' — no STL on file'}
              </span>
              {job.printFileID ? (
                <a
                  href={`/api/files/${job.printFileID}`}
                  className="text-accent inline-flex shrink-0 items-center gap-1 text-xs font-medium"
                >
                  <Download className="size-3" aria-hidden />
                  Download STL
                </a>
              ) : null}
            </div>
          </Field>
          <Field label="Reason" htmlFor="reprint-reason" required>
            <Select
              id="reprint-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              aria-label="Reprint reason"
            >
              <option value="">Why is this being reprinted?</option>
              {FAILURE_REASONS.map(value => (
                <option key={value} value={value}>
                  {REASON_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notes" htmlFor="reprint-notes" hint="Optional">
            <Textarea
              id="reprint-notes"
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
          <div className="flex justify-end">
            <Button size="sm" disabled={pending} onClick={() => void submit()}>
              {pending ? 'Queueing…' : 'Queue reprint'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
