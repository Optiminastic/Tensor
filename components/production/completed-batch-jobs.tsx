'use client'

import { Check, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type JSX } from 'react'

import {
  listBatchJobs,
  markJobPrintDone,
} from '@/app/dashboard/[brand]/production/batch-jobs-actions'
import { ReprintDialog } from '@/components/production/reprint-dialog'
import { Button } from '@/components/ui/button'
import { countdown } from '@/lib/format'
import type { ProductionJob } from '@/lib/validators/production'

interface CompletedBatchJobsProps {
  brand: string
  batchId: string
}

/** The jobs inside a completed batch, listed individually under its card on
 * the machine-assignment board. Loaded on expand rather than with the board,
 * so nothing is fetched until an operator opens a batch. Each row links to the
 * job's own page and offers the two decisions that follow a finished print:
 * Done (no assembly needed - straight to Finishing) or Reprint. */
export function CompletedBatchJobs({ brand, batchId }: CompletedBatchJobsProps): JSX.Element {
  const [jobs, setJobs] = useState<ProductionJob[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    void listBatchJobs(batchId).then(res => {
      if (!live) return
      if (!res.ok) {
        setError(res.error ?? "Could not load the batch's jobs.")
        return
      }
      setJobs(res.data ?? [])
    })
    return () => {
      live = false
    }
  }, [batchId])

  if (error) {
    return (
      <p role="alert" className="text-danger px-3 py-2 text-xs">
        {error}
      </p>
    )
  }
  if (jobs === null) {
    return <p className="text-muted-foreground px-3 py-2 text-xs">Loading jobs…</p>
  }
  if (jobs.length === 0) {
    return <p className="text-muted-foreground px-3 py-2 text-xs">No jobs in this batch.</p>
  }

  return (
    <ul className="border-border flex flex-col divide-y border-t">
      {jobs.map(job => (
        <CompletedJobRow key={job.id} brand={brand} job={job} />
      ))}
    </ul>
  )
}

interface CompletedJobRowProps {
  brand: string
  job: ProductionJob
}

function CompletedJobRow({ brand, job }: CompletedJobRowProps): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // A job leaves this list once assembly is resolved - it has moved on to the
  // Finishing tab - so the row shows its own state rather than disappearing
  // before the board is revalidated.
  const settled = job.assembly_status !== 'pending'

  async function done(): Promise<void> {
    setPending(true)
    setError(null)
    const res = await markJobPrintDone(brand, job.id)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not mark it done.')
      return
    }
    router.refresh()
  }

  return (
    <li className="flex flex-col gap-1.5 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/dashboard/${brand}/production/jobs/${job.id}`}
          className="group flex min-w-0 flex-1 items-center gap-2"
        >
          <span className="font-mono text-xs font-medium">{job.job_number}</span>
          <span className="text-muted-foreground truncate text-xs">
            {job.product_name ?? job.description}
          </span>
          <ChevronRight
            className="text-subtle-foreground size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </Link>
        {settled ? (
          <span className="text-success inline-flex shrink-0 items-center gap-1 text-xs font-medium">
            <Check className="size-3" aria-hidden />
            Done
          </span>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" disabled={pending} onClick={() => void done()}>
              {pending ? 'Saving…' : 'Done'}
            </Button>
            <ReprintDialog
              brand={brand}
              job={{
                id: job.id,
                jobNumber: job.job_number,
                productName: job.product_name ?? job.description,
                printFileID: job.print_file_id ?? null,
              }}
            />
          </div>
        )}
      </div>
      <p className="text-subtle-foreground font-mono text-[11px] tabular-nums">
        {job.quantity} pc{job.quantity === 1 ? '' : 's'}
        {typeof job.estimated_print_time_minutes === 'number'
          ? ` · ${countdown(job.estimated_print_time_minutes * 60)} est.`
          : ''}
        {typeof job.filament_grams_required === 'number'
          ? ` · ${Math.round(job.filament_grams_required)} g`
          : ''}
        {job.material ? ` · ${job.material}` : ''}
        {job.colour ? ` · ${job.colour}` : ''}
      </p>
      {error ? (
        <p role="alert" className="text-danger text-[11px]">
          {error}
        </p>
      ) : null}
    </li>
  )
}
