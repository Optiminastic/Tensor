'use client'

import { Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX, type MouseEvent } from 'react'

import {
  completeBatchJobsAction,
  listBatchJobs,
} from '@/app/dashboard/[brand]/production/batch-jobs-actions'
import { orderNumberFromJobNumber } from '@/components/production/order-number'
import type { BatchStatus } from '@/components/production/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { ProductionJob } from '@/lib/validators/production'

interface BatchDoneDialogProps {
  brand: string
  batchId: string
  batchNumber: string
  status: BatchStatus
  /** Rendered inside a clickable table row, where the click must not also open the batch. */
  stopPropagation?: boolean
}

/** A plank that has already been signed off, or failed and is being reprinted. */
function isSettled(job: ProductionJob): boolean {
  return job.status === 'completed' || job.status === 'failed'
}

interface PlankListProps {
  loading: boolean
  jobs: ProductionJob[]
  selected: Set<string>
  onToggle: (jobId: string) => void
}

/**
 * One row per plank, by order number - which is what the floor works from. A
 * plank already settled is shown ticked and disabled: it is there so the list
 * matches the plate, not so it can be signed off twice.
 */
function PlankList({ loading, jobs, selected, onToggle }: PlankListProps): JSX.Element {
  if (loading) return <p className="text-muted-foreground text-sm">Loading…</p>
  if (jobs.length === 0) {
    return <p className="text-muted-foreground text-sm">This batch has no jobs on it.</p>
  }
  return (
    <>
      {jobs.map(job => {
        const settled = isSettled(job)
        return (
          <label
            key={job.id}
            className={`flex items-center gap-3 text-sm ${settled ? 'opacity-60' : ''}`}
          >
            <input
              type="checkbox"
              checked={settled || selected.has(job.id)}
              disabled={settled}
              onChange={() => onToggle(job.id)}
            />
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-xs tabular-nums ${
                settled
                  ? 'bg-success-subtle text-success'
                  : 'bg-surface-muted text-muted-foreground'
              }`}
            >
              {orderNumberFromJobNumber(job.job_number)}
            </span>
            <span className="flex-1">{job.product_name ?? job.description}</span>
            <span className="text-muted-foreground text-xs">{settled ? job.status : ''}</span>
          </label>
        )
      })}
    </>
  )
}

/**
 * Signs off a bed, plank by plank.
 *
 * Marking a whole bed Done in one action assumed every plank on it succeeded,
 * which is not how a plate comes off a printer: three are good and one warped.
 * So this asks which. The ticked planks are completed - putting them in front of
 * Assembly, QC and Packaging - and the bed itself stays where it is until
 * nothing on it is outstanding, so the one still being sorted out does not
 * vanish from the floor's view.
 */
export function BatchDoneDialog({
  brand,
  batchId,
  batchNumber,
  status,
  stopPropagation = false,
}: BatchDoneDialogProps): JSX.Element | null {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<ProductionJob[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())

  if (status === 'completed') {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
        <Check className="size-3.5" aria-hidden />
        Done
      </span>
    )
  }

  const outstanding = jobs.filter(job => !isSettled(job))
  const allSelected = outstanding.length > 0 && selected.size === outstanding.length

  async function onOpenChange(next: boolean): Promise<void> {
    setOpen(next)
    if (!next) return
    setError(null)
    setSelected(new Set())
    setLoading(true)
    const res = await listBatchJobs(batchId)
    setLoading(false)
    if (!res.ok) {
      setError(res.error ?? "Could not load the batch's jobs.")
      return
    }
    const loaded = res.data ?? []
    setJobs(loaded)
    // Everything outstanding pre-ticked: finishing the whole plate is the
    // common case, and un-ticking the one that warped is less work than
    // ticking the three that did not.
    setSelected(new Set(loaded.filter(job => !isSettled(job)).map(job => job.id)))
  }

  function toggle(jobId: string): void {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }

  function toggleAll(): void {
    setSelected(allSelected ? new Set() : new Set(outstanding.map(job => job.id)))
  }

  async function submit(): Promise<void> {
    setSubmitting(true)
    setError(null)
    const res = await completeBatchJobsAction(brand, batchId, Array.from(selected))
    setSubmitting(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not mark those jobs done.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={next => void onOpenChange(next)}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          title={`Mark planks on ${batchNumber} done`}
          onClick={event => {
            if (stopPropagation) (event as MouseEvent<HTMLButtonElement>).stopPropagation()
          }}
        >
          <Check className="size-3.5" aria-hidden />
          Mark done
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg" onClick={event => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Mark planks done on {batchNumber}</DialogTitle>
          <DialogDescription>
            Tick the orders that came off the plate. The batch stays open until every plank on it is
            done.
          </DialogDescription>
        </DialogHeader>
        {outstanding.length > 0 ? (
          <label className="text-muted-foreground flex items-center gap-3 border-b pb-2 text-sm">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            Select all {outstanding.length} outstanding
          </label>
        ) : null}
        <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
          <PlankList loading={loading} jobs={jobs} selected={selected} onToggle={toggle} />
        </div>
        {error ? (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={submitting || selected.size === 0}
            onClick={() => void submit()}
          >
            {submitting ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Check className="size-3.5" aria-hidden />
            )}
            {submitting
              ? 'Marking…'
              : `Mark ${selected.size} done${
                  selected.size === outstanding.length && outstanding.length > 0
                    ? ' and finish batch'
                    : ''
                }`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
