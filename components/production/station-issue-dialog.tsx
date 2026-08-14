'use client'

import { TriangleAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { reportJobIssue } from '@/app/dashboard/[brand]/production/station-issue-actions'
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
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { type IssueStage, STATION_ISSUE_REASONS } from '@/lib/validators/production'

// The backend's fixed taxonomy, given operator-readable labels.
const REASON_LABELS: Record<(typeof STATION_ISSUE_REASONS)[number], string> = {
  missing_part: 'Missing part',
  damaged_part: 'Damaged part',
  poor_surface_finish: 'Poor surface finish',
  wrong_colour: 'Wrong colour',
  wrong_personalisation: 'Wrong personalisation',
  dimension_out_of_spec: 'Dimension out of spec',
  cracked: 'Cracked',
  warped: 'Warped',
  hardware_missing: 'Hardware missing',
  addon_faulty: 'Add-on faulty',
  other: 'Other',
}

const STAGE_LABELS: Record<IssueStage, string> = {
  assembly: 'Assembly',
  finishing: 'Finishing',
  qc: 'Quality check',
}

interface StationIssueDialogProps {
  brand: string
  stage: IssueStage
  job: { id: string; jobNumber: string; quantity: number }
}

/** Records a problem found at a station: reason, comment, who and when, kept in
 * the job's history permanently. The job is NOT moved or hidden - it stays in
 * this queue and can still be completed, which is what an operator who found a
 * small defect and fixed it actually needs. At QC the same dialog can queue a
 * reprint of just the affected units. */
export function StationIssueDialog({ brand, stage, job }: StationIssueDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')
  const [requestReprint, setRequestReprint] = useState(false)
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function reset(): void {
    setReason('')
    setComment('')
    setRequestReprint(false)
    setQuantity('1')
    setError(null)
  }

  async function submit(): Promise<void> {
    setError(null)
    if (!reason) {
      setError('Pick what went wrong.')
      return
    }
    const parsedQuantity = Number(quantity)
    if (requestReprint && (!Number.isInteger(parsedQuantity) || parsedQuantity < 1)) {
      setError('The reprint quantity must be a whole number of at least 1.')
      return
    }
    if (requestReprint && parsedQuantity > job.quantity) {
      setError(
        `This job is only ${job.quantity} units, so at most ${job.quantity} can be reprinted.`,
      )
      return
    }
    setPending(true)
    const res = await reportJobIssue(brand, job.id, {
      stage,
      reason,
      comment: comment.trim() || null,
      request_reprint: requestReprint,
      quantity: requestReprint ? parsedQuantity : null,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not record the issue.')
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
        if (next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <TriangleAlert className="size-3.5" aria-hidden />
          Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {STAGE_LABELS[stage]} issue — {job.jobNumber}
          </DialogTitle>
          <DialogDescription>
            Recorded permanently on this job&apos;s history. The job stays in this queue and can
            still be completed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="What went wrong" htmlFor="issue-reason" required>
            <Select
              id="issue-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              aria-label="Issue reason"
            >
              <option value="">Select a reason…</option>
              {STATION_ISSUE_REASONS.map(value => (
                <option key={value} value={value}>
                  {REASON_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Comment" htmlFor="issue-comment" hint="What you saw, in your own words">
            <Textarea
              id="issue-comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
            />
          </Field>
          {stage === 'qc' ? (
            <>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">Also queue a reprint</span>
                <Switch checked={requestReprint} onCheckedChange={setRequestReprint} />
              </label>
              {requestReprint ? (
                <Field
                  label="Units to reprint"
                  htmlFor="issue-quantity"
                  hint={`This job is ${job.quantity} unit${job.quantity === 1 ? '' : 's'}`}
                >
                  <Input
                    id="issue-quantity"
                    type="number"
                    min={1}
                    max={job.quantity}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                  />
                </Field>
              ) : null}
            </>
          ) : null}
          {error ? (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button size="sm" disabled={pending} onClick={() => void submit()}>
              {pending ? 'Saving…' : 'Record issue'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
