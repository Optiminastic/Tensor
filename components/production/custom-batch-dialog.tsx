'use client'

import { Layers, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type JSX } from 'react'

import {
  createCustomBatchAction,
  loadBatchableJobs,
} from '@/app/dashboard/[brand]/production/batch-jobs-actions'
import { BatchableJobSearch, type BedSoFar } from '@/components/production/batchable-job-search'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { BatchableJob } from '@/lib/validators/production'

interface CustomBatchDialogProps {
  brand: string
}

/**
 * Building a bed by hand, from named jobs.
 *
 * The planner decides what shares a plate, and for the ordinary run of planks
 * it decides well. It cannot decide everything: a customer rings up wanting
 * their two planks together, a blue spool is nearly out and should be finished
 * off, a reprint ought to ride along with the order it belongs to. None of
 * those is a rule worth teaching the planner, and all of them are obvious to
 * the person looking at the job.
 *
 * So the bed is assembled job by job, searched for by the number the floor
 * already uses. This listed unfulfilled ORDERS once, on the reasoning that
 * nobody thinks in job numbers — but an order row cannot say "that one plank of
 * the three", and the case this dialog is opened for is almost always a
 * particular plank rather than a particular customer.
 *
 * The first pick decides the bed. A plate is sliced once against one filament
 * load, so everything after it must share that colour, material and nozzle
 * setup, and the search stops suggesting what cannot join.
 */
export function CustomBatchDialog({ brand }: CustomBatchDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [jobs, setJobs] = useState<BatchableJob[]>([])
  const [unitsPerBed, setUnitsPerBed] = useState(5)
  const [minUnits, setMinUnits] = useState(1)
  const [chosen, setChosen] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  // Read when the dialog opens, never with the page: the pool changes as beds
  // are planned, and a list fetched at page load would offer jobs another bed
  // has since claimed.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError('')
    setChosen([])
    setQuery('')

    void loadBatchableJobs().then(res => {
      if (cancelled) return
      setLoading(false)
      if (!res.ok || !res.data) {
        setError(res.error ?? 'Could not read the jobs waiting.')
        return
      }
      setJobs(res.data.jobs)
      setUnitsPerBed(res.data.units_per_bed)
      setMinUnits(res.data.min_units_per_bed)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  // In the order they were picked, so the bed reads as it was built and the
  // first row is visibly the one that set the colour.
  const chosenJobs = useMemo(
    () =>
      chosen
        .map(id => jobs.find(job => job.job_id === id))
        .filter((job): job is BatchableJob => job !== undefined),
    [chosen, jobs],
  )
  const placesUsed = chosenJobs.reduce((n, job) => n + job.units, 0)
  const bed: BedSoFar = {
    key: chosenJobs[0]?.compatibility_key ?? '',
    colour: chosenJobs[0]?.colour_label ?? '',
    placesUsed,
    unitsPerBed,
  }

  function pick(job: BatchableJob): void {
    setError('')
    setQuery('')
    setChosen(prev => (prev.includes(job.job_id) ? prev : [...prev, job.job_id]))
  }

  function drop(jobID: string): void {
    setError('')
    setChosen(prev => prev.filter(id => id !== jobID))
  }

  async function create(): Promise<void> {
    setPending(true)
    setError('')
    const res = await createCustomBatchAction(brand, { job_ids: chosen })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not create the batch.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          <Layers className="size-3.5" aria-hidden />
          Create custom batch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Build a bed by hand</DialogTitle>
          <DialogDescription>
            {bed.key
              ? `A ${bed.colour || 'single'} bed — ${placesUsed} of ${unitsPerBed} places used. Only jobs that can share this plate are suggested.`
              : `Search a job and add it. A plate holds ${unitsPerBed} and prints one colour, so the first job decides what else can go on it.`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-muted-foreground text-sm">Reading the jobs waiting…</p>
        ) : (
          <>
            <ChosenJobs jobs={chosenJobs} onDrop={drop} />
            <BatchableJobSearch
              jobs={jobs}
              chosen={chosen}
              bed={bed}
              query={query}
              onQueryChange={setQuery}
              onPick={pick}
            />
          </>
        )}

        {error ? (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-xs">
            {summarise({ chosenJobs, placesUsed, unitsPerBed, minUnits })}
          </span>
          <Button
            type="button"
            onClick={() => void create()}
            disabled={pending || chosen.length === 0}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
            {pending ? 'Creating…' : 'Create batch'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ChosenJobsProps {
  jobs: BatchableJob[]
  onDrop: (jobID: string) => void
}

/**
 * The bed as it stands.
 *
 * Above the search rather than below it, because once two or three jobs are on
 * it this is the thing being worked on and the search is the tool. The first
 * row is marked: it is the one that fixed the colour, and dropping it frees the
 * bed to become another.
 */
function ChosenJobs({ jobs, onDrop }: ChosenJobsProps): JSX.Element | null {
  if (jobs.length === 0) return null
  return (
    <ul className="border-border bg-surface-muted flex flex-col rounded-md border">
      {jobs.map((job, index) => (
        <li
          key={job.job_id}
          className="border-border flex items-center gap-3 border-b p-2 text-sm last:border-b-0"
        >
          <span className="font-mono text-xs tabular-nums">{job.job_number}</span>
          <span className="min-w-0 flex-1 truncate">{job.product || 'Untitled product'}</span>
          <span className="text-muted-foreground text-xs">#{job.order_number}</span>
          <span className="text-muted-foreground text-xs">
            {job.colour_label}
            {index === 0 ? ' · sets the bed' : ''}
          </span>
          {job.units > 1 ? (
            <span className="font-mono text-xs tabular-nums">×{job.units}</span>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Remove ${job.job_number} from this bed`}
            onClick={() => onDrop(job.job_id)}
          >
            <X className="size-3.5" aria-hidden />
          </Button>
        </li>
      ))}
    </ul>
  )
}

interface SummaryInput {
  chosenJobs: BatchableJob[]
  placesUsed: number
  unitsPerBed: number
  minUnits: number
}

/**
 * The line under the bed: what it holds and what choosing it costs.
 *
 * A bed under the floor is not refused — it can be built and will simply wait
 * for company before it locks — but saying so here is the difference between
 * that and a bed somebody thinks is on its way to a printer.
 */
function summarise({ chosenJobs, placesUsed, unitsPerBed, minUnits }: SummaryInput): string {
  if (chosenJobs.length === 0) return 'Nothing chosen yet'

  const parts = [
    `${chosenJobs.length} ${chosenJobs.length === 1 ? 'job' : 'jobs'}, ${placesUsed} of ${unitsPerBed} places`,
  ]
  if (placesUsed < minUnits) {
    parts.push(`under ${minUnits}, so it waits for company before it prints`)
  }
  // Counted by bed rather than by plank: two jobs off one bed rebuild one bed.
  const rebuilt = new Set(
    chosenJobs.filter(job => job.bed_locked && job.on_bed !== '').map(job => job.on_bed),
  ).size
  if (rebuilt > 0) parts.push(`rebuilds ${rebuilt} locked ${rebuilt === 1 ? 'bed' : 'beds'}`)

  const reprinting = chosenJobs.filter(job => job.reprint).reduce((n, job) => n + job.units, 0)
  if (reprinting > 0) {
    parts.push(
      `${reprinting} already printed, ${reprinting === 1 ? 'a second one' : 'second copies'} will be made`,
    )
  }
  return parts.join(' — ')
}
