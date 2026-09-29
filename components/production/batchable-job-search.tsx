'use client'

import { Search } from 'lucide-react'
import type { JSX } from 'react'

import { Input } from '@/components/ui/input'
import type { BatchableJob } from '@/lib/validators/production'

/**
 * The bed as it stands, which is what decides whether a job may still join it.
 *
 * `key` is empty until something is chosen — before that everything is offered,
 * and after it nothing of another colour is.
 */
export interface BedSoFar {
  key: string
  colour: string
  placesUsed: number
  unitsPerBed: number
}

interface BatchableJobSearchProps {
  jobs: BatchableJob[]
  chosen: string[]
  bed: BedSoFar
  query: string
  onQueryChange: (query: string) => void
  onPick: (job: BatchableJob) => void
}

/** Enough to show there is a pool without turning the dialog into a list. */
const BROWSE_LIMIT = 8
const SEARCH_LIMIT = 25

/**
 * Finding the plank you mean, by the number the floor calls it.
 *
 * Typed, not browsed. Somebody opens this because a named job has to go on a
 * plate now — a customer rang, a reprint belongs with its order, a spool is
 * nearly out — and the job number is what the queue, the issues board and the
 * plate itself all call that plank.
 *
 * The first pick decides the bed. A plate is sliced once against one filament
 * load, so everything after it must share that colour, material and nozzle
 * setup. While browsing, jobs that cannot join are simply not suggested. While
 * SEARCHING they are shown, greyed, with the reason: a search for JOB-1000008
 * that returns nothing cannot tell "wrong colour" from "no such job", and the
 * person typing it has asked a direct question about that plank.
 */
export function BatchableJobSearch({
  jobs,
  chosen,
  bed,
  query,
  onQueryChange,
  onPick,
}: BatchableJobSearchProps): JSX.Element {
  const searching = query.trim() !== ''
  const matched = jobs.filter(job => !chosen.includes(job.job_id) && matches(job, query))
  const offered = searching ? matched : matched.filter(job => blockedFor(job, bed) === null)
  const shown = offered.slice(0, searching ? SEARCH_LIMIT : BROWSE_LIMIT)

  return (
    <div className="flex flex-col gap-2">
      <label className="relative flex items-center">
        <Search className="text-muted-foreground absolute left-2.5 size-3.5" aria-hidden />
        <Input
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="Search a job number, order or product"
          aria-label="Search jobs to add to this bed"
          className="pl-8"
        />
      </label>

      {shown.length === 0 ? (
        <p className="text-muted-foreground border-border rounded-md border p-4 text-center text-sm">
          {searching
            ? `No job matches “${query.trim()}”.`
            : bed.key
              ? 'No other job outstanding can share this bed.'
              : 'Nothing is outstanding. Every unfulfilled order has been printed.'}
        </p>
      ) : (
        <ul className="border-border max-h-72 overflow-y-auto rounded-md border">
          {shown.map(job => (
            <JobRow key={job.job_id} job={job} blocked={blockedFor(job, bed)} onPick={onPick} />
          ))}
        </ul>
      )}

      {offered.length > shown.length ? (
        <p className="text-subtle-foreground text-xs">
          Showing {shown.length} of {offered.length}. Type a job or order number to narrow it.
        </p>
      ) : null}
    </div>
  )
}

interface JobRowProps {
  job: BatchableJob
  /** Why this job cannot be picked, or null when it can. */
  blocked: string | null
  onPick: (job: BatchableJob) => void
}

function JobRow({ job, blocked, onPick }: JobRowProps): JSX.Element {
  return (
    <li className="border-border border-b last:border-b-0">
      <button
        type="button"
        disabled={blocked !== null}
        onClick={() => onPick(job)}
        className={`flex w-full items-center gap-3 p-2 text-left text-sm ${
          blocked !== null ? 'opacity-50' : 'hover:bg-surface-muted cursor-pointer'
        }`}
      >
        <span className="font-mono text-xs tabular-nums">{job.job_number}</span>
        <span className="min-w-0 flex-1 truncate">{job.product || 'Untitled product'}</span>
        <span className="text-muted-foreground text-xs">#{job.order_number}</span>
        <span className="text-muted-foreground text-xs">{job.colour_label}</span>
        {job.units > 1 ? (
          <span className="font-mono text-xs tabular-nums">×{job.units}</span>
        ) : null}
        <span className="w-56 shrink-0 text-right text-xs">{noteFor(job, blocked)}</span>
      </button>
    </li>
  )
}

/** The right-hand note: why it cannot be picked, or what picking it means. */
function noteFor(job: BatchableJob, blocked: string | null): JSX.Element | null {
  if (blocked !== null) return <span className="text-subtle-foreground">{blocked}</span>
  // Already printed. Where it actually is matters more than that it can be
  // picked: "waiting for QC" is usually the real answer to why the order is
  // still open, and a second plank is a deliberate choice rather than the
  // obvious one.
  if (job.reprint) return <span className="text-warning">{job.finished_stage} — reprints</span>
  if (job.on_bed !== '') {
    return job.bed_locked ? (
      <span className="text-warning">moves off locked {job.on_bed}</span>
    ) : (
      <span className="text-subtle-foreground">on {job.on_bed}</span>
    )
  }
  return null
}

/**
 * Why this job cannot join the bed, or null when it can.
 *
 * Ordered by what the person can do about it. "On hold" is somebody's to
 * clear; the colour is a property of the bed they are building and is fixed by
 * their own first pick; a full bed is neither.
 */
function blockedFor(job: BatchableJob, bed: BedSoFar): string | null {
  if (!job.available) return job.unavailable_reason || 'not ready to print'
  if (bed.key !== '' && job.compatibility_key !== bed.key) {
    return `${job.colour_label || 'another colour'} — this bed is ${bed.colour}`
  }
  // Full means full: a bed with four of five places cannot take a job of two,
  // and offering it only to refuse on create wastes the click.
  if (bed.placesUsed + job.units > bed.unitsPerBed) {
    return `no room — ${bed.placesUsed} of ${bed.unitsPerBed} places used`
  }
  return null
}

/**
 * Whether a typed query names this job.
 *
 * The job number first, because that is what this box is for, but the order
 * number and product too: somebody holding a customer's order number should not
 * have to translate it into job numbers before they can search.
 */
function matches(job: BatchableJob, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (needle === '') return true
  return [job.job_number, job.order_number, job.product, job.colour_label].some(field =>
    field.toLowerCase().includes(needle),
  )
}
