'use client'

import { Layers, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type JSX } from 'react'

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
import type { BatchableJob } from '@/lib/validators/custom-batch'

interface CustomBatchDialogProps {
  brand: string
}

/** Long enough that typing a job number is one request, short enough to feel live. */
const TYPING_PAUSE_MS = 250

/**
 * Building a bed by hand, from named jobs.
 *
 * The planner decides what shares a plate, and for the ordinary run of planks
 * it decides well. It cannot decide everything: a customer rings up wanting
 * their two planks together, a blue spool is nearly out and should be finished
 * off, a plank that printed badly ought to ride along with the order it belongs
 * to. None of those is a rule worth teaching the planner, and all of them are
 * obvious to the person holding the job number.
 *
 * So the bed is assembled job by job, searched for by the number the rest of
 * the floor already uses. Every job is reachable, not only the ones on an
 * outstanding order — a shipped order missing a plank and a reprint are exactly
 * the cases somebody comes here with a number for.
 *
 * The first pick decides the bed. A plate is sliced once against one filament
 * load, so everything after it must share that colour, material and nozzle
 * setup, and the suggestions narrow to what can join.
 */
export function CustomBatchDialog({ brand }: CustomBatchDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [jobs, setJobs] = useState<BatchableJob[]>([])
  const [total, setTotal] = useState(0)
  const [more, setMore] = useState(false)
  const [unitsPerBed, setUnitsPerBed] = useState(5)
  const [minUnits, setMinUnits] = useState(1)
  // The chosen JOBS, not their ids. The pool behind them is re-read on every
  // keystroke and a job that no longer matches the search would otherwise drop
  // out of the bed while somebody was still building it.
  const [chosen, setChosen] = useState<BatchableJob[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const placesUsed = chosen.reduce((n, job) => n + job.units, 0)
  const bed: BedSoFar = {
    key: chosen[0]?.compatibility_key ?? '',
    colour: chosen[0]?.colour_label ?? '',
    placesUsed,
    unitsPerBed,
  }

  // A fresh dialog every time. The pool changes as beds are planned, and a bed
  // half-built in a previous opening is not something to come back to.
  useEffect(() => {
    if (!open) return
    setChosen([])
    setQuery('')
    setError('')
  }, [open])

  // Searched in the backend, so this runs on the term and on the bed's colour.
  // The pause is what makes typing a job number one request rather than ten.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)

    const handle = setTimeout(
      () => {
        void loadBatchableJobs(query.trim(), bed.key).then(res => {
          if (cancelled) return
          setLoading(false)
          if (!res.ok || !res.data) {
            setError(res.error ?? 'Could not read the jobs waiting.')
            return
          }
          setJobs(res.data.jobs)
          setTotal(res.data.total)
          setMore(res.data.more)
          setUnitsPerBed(res.data.units_per_bed)
          setMinUnits(res.data.min_units_per_bed)
        })
      },
      query.trim() === '' ? 0 : TYPING_PAUSE_MS,
    )

    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [open, query, bed.key])

  function pick(job: BatchableJob): void {
    setError('')
    setQuery('')
    setChosen(prev => (prev.some(j => j.job_id === job.job_id) ? prev : [...prev, job]))
  }

  function drop(jobID: string): void {
    setError('')
    setChosen(prev => prev.filter(job => job.job_id !== jobID))
  }

  async function create(): Promise<void> {
    setPending(true)
    setError('')
    const res = await createCustomBatchAction(brand, { job_ids: chosen.map(job => job.job_id) })
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
              : `Search any job by its number. A plate holds ${unitsPerBed} and prints one colour, so the first job decides what else can go on it.`}
          </DialogDescription>
        </DialogHeader>

        <ChosenJobs jobs={chosen} onDrop={drop} />
        <BatchableJobSearch
          jobs={jobs}
          total={total}
          more={more}
          chosen={chosen.map(job => job.job_id)}
          bed={bed}
          query={query}
          loading={loading}
          onQueryChange={setQuery}
          onPick={pick}
        />

        {error ? (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-xs">
            {summarise({ chosen, placesUsed, unitsPerBed, minUnits })}
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
  chosen: BatchableJob[]
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
function summarise({ chosen, placesUsed, unitsPerBed, minUnits }: SummaryInput): string {
  if (chosen.length === 0) return 'Nothing chosen yet'

  const parts = [
    `${chosen.length} ${chosen.length === 1 ? 'job' : 'jobs'}, ${placesUsed} of ${unitsPerBed} places`,
  ]
  if (placesUsed < minUnits) {
    parts.push(`under ${minUnits}, so it waits for company before it prints`)
  }
  // Counted by bed rather than by plank: two jobs off one bed rebuild one bed.
  const rebuilt = new Set(
    chosen.filter(job => job.bed_locked && job.on_bed !== '').map(job => job.on_bed),
  ).size
  if (rebuilt > 0) parts.push(`rebuilds ${rebuilt} locked ${rebuilt === 1 ? 'bed' : 'beds'}`)

  const reprinting = chosen.filter(job => job.reprint).reduce((n, job) => n + job.units, 0)
  if (reprinting > 0) {
    parts.push(
      `${reprinting} already printed, ${reprinting === 1 ? 'a second one' : 'second copies'} will be made`,
    )
  }
  return parts.join(' — ')
}
