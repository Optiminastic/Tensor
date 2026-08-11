'use client'

import { PackagePlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import {
  addJobsToBatchAction,
  listCompatibleJobsForBatchAction,
} from '@/app/dashboard/[brand]/production/actions'
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

interface AddJobsToBatchDialogProps {
  brand: string
  batchId: string
  canEdit: boolean
  isFull: boolean
}

function toggleSelection(selected: Set<string>, jobId: string): Set<string> {
  const next = new Set(selected)
  if (next.has(jobId)) next.delete(jobId)
  else next.add(jobId)
  return next
}

interface CompatibleJobsListProps {
  loading: boolean
  jobs: ProductionJob[]
  selected: Set<string>
  onToggle: (jobId: string) => void
}

function CompatibleJobsList({
  loading,
  jobs,
  selected,
  onToggle,
}: CompatibleJobsListProps): JSX.Element {
  if (loading) return <p className="text-muted-foreground text-sm">Loading…</p>
  if (jobs.length === 0) {
    return <p className="text-muted-foreground text-sm">No compatible unassigned jobs.</p>
  }
  return (
    <>
      {jobs.map(job => (
        <label key={job.id} className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={selected.has(job.id)} onChange={() => onToggle(job.id)} />
          <span className="font-mono text-xs">{job.job_number}</span>
          <span className="flex-1">{job.product_name ?? job.description}</span>
          <span className="text-muted-foreground font-mono text-xs">Qty {job.quantity}</span>
        </label>
      ))}
    </>
  )
}

/** Adds unassigned, configuration-matching jobs onto a Draft batch and
 * re-merges its plate preview. Hidden entirely (not just disabled) once the
 * batch is approved or already full - see canEdit/isFull, computed by the
 * caller from the batch's status and bed_utilization_percent. */
export function AddJobsToBatchDialog({
  brand,
  batchId,
  canEdit,
  isFull,
}: AddJobsToBatchDialogProps): JSX.Element | null {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<ProductionJob[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())

  async function onOpenChange(next: boolean): Promise<void> {
    setOpen(next)
    if (!next) return
    setError(null)
    setSelected(new Set())
    setLoading(true)
    const res = await listCompatibleJobsForBatchAction(batchId)
    setLoading(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not load compatible jobs.')
      return
    }
    setJobs(res.data ?? [])
  }

  async function submit(): Promise<void> {
    setSubmitting(true)
    setError(null)
    const res = await addJobsToBatchAction(brand, batchId, { job_ids: Array.from(selected) })
    setSubmitting(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not add the jobs.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  if (!canEdit) return null
  if (isFull) {
    return (
      <p className="text-muted-foreground text-sm">
        This batch is full — remove a job to add another.
      </p>
    )
  }

  return (
    <Dialog open={open} onOpenChange={next => void onOpenChange(next)}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <PackagePlus className="size-3.5" aria-hidden />
          Add jobs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add jobs to this batch</DialogTitle>
          <DialogDescription>
            Only unassigned jobs matching this batch&apos;s material, nozzle, and machine
            configuration are shown.
          </DialogDescription>
        </DialogHeader>
        <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
          <CompatibleJobsList
            loading={loading}
            jobs={jobs}
            selected={selected}
            onToggle={jobId => setSelected(prev => toggleSelection(prev, jobId))}
          />
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
            {submitting ? 'Adding…' : `Add ${selected.size} job${selected.size === 1 ? '' : 's'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
