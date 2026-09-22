'use client'

import { Layers, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type JSX } from 'react'

import {
  createCustomBatchAction,
  loadBatchableJobs,
} from '@/app/dashboard/[brand]/production/batch-jobs-actions'
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
 * Building a bed by hand.
 *
 * The planner decides what shares a plate, and for the ordinary run of planks
 * it decides well. It cannot decide everything: a customer rings up wanting
 * their two planks together, a blue spool is nearly out and should be finished
 * off, a reprint ought to ride along with the order it belongs to. None of
 * those is a rule worth teaching the planner, and all of them are obvious to
 * the person looking at the orders.
 *
 * The first pick decides the bed. A plate is sliced once against one filament
 * load, so everything after it must share that colour, material and nozzle
 * setup — and rather than letting somebody choose a second colour and then
 * refusing them, the products that cannot join simply stop being offered. The
 * constraint is the same one the planner obeys; what changes is who chooses
 * within it.
 */
export function CustomBatchDialog({ brand }: CustomBatchDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [jobs, setJobs] = useState<BatchableJob[]>([])
  const [unitsPerBed, setUnitsPerBed] = useState(4)
  const [chosen, setChosen] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  // Read when the dialog opens, never with the page: the pool changes as beds
  // are planned, and a list fetched at page load would offer products another
  // bed has since claimed.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError('')
    setChosen([])

    void loadBatchableJobs().then(res => {
      if (cancelled) return
      setLoading(false)
      if (!res.ok || !res.data) {
        setError(res.error ?? 'Could not read the products waiting.')
        return
      }
      setJobs(res.data.jobs)
      setUnitsPerBed(res.data.units_per_bed)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  const chosenJobs = useMemo(() => jobs.filter(j => chosen.includes(j.id)), [jobs, chosen])
  // The bed's signature, set by whatever was picked first.
  const bedKey = chosenJobs[0]?.compatibility_key ?? ''
  const placesUsed = chosenJobs.reduce((n, j) => n + (j.quantity || 1), 0)
  const available = jobs.filter(j => j.available).length
  // How many approved beds this selection would pull apart, counted by bed
  // rather than by plank: taking two planks off one bed rebuilds one bed.
  const movingOffLocked = new Set(
    chosenJobs.filter(j => j.bed_locked && j.on_bed).map(j => j.on_bed),
  ).size
  const reprinting = chosenJobs.filter(j => j.reprint).length

  function toggle(job: BatchableJob): void {
    setError('')
    setChosen(prev =>
      prev.includes(job.id) ? prev.filter(id => id !== job.id) : [...prev, job.id],
    )
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
            {bedKey
              ? `A ${chosenJobs[0]?.colour_label || 'single'} bed — ${placesUsed} of ${unitsPerBed} places used. Only products that can share this plate are shown.`
              : `Every product from an unfulfilled order. ${available} of ${jobs.length} can be moved; the rest say why not. A plate holds ${unitsPerBed} and prints one colour, so the first pick decides what else can go on.`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-muted-foreground text-sm">Reading what is waiting…</p>
        ) : (
          <JobPicker
            jobs={jobs}
            chosen={chosen}
            bedKey={bedKey}
            placesUsed={placesUsed}
            unitsPerBed={unitsPerBed}
            onToggle={toggle}
          />
        )}

        {error ? (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-xs">
            {chosen.length === 0
              ? 'Nothing chosen yet'
              : `${chosen.length} ${chosen.length === 1 ? 'product' : 'products'}, ${placesUsed} of ${unitsPerBed} places`}
            {movingOffLocked > 0
              ? ` — rebuilds ${movingOffLocked} locked ${movingOffLocked === 1 ? 'bed' : 'beds'}`
              : ''}
            {reprinting > 0
              ? ` — ${reprinting} already printed, ${reprinting === 1 ? 'a second one' : 'second copies'} will be made`
              : ''}
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

interface JobPickerProps {
  jobs: BatchableJob[]
  chosen: string[]
  bedKey: string
  placesUsed: number
  unitsPerBed: number
  onToggle: (job: BatchableJob) => void
}

function JobPicker({
  jobs,
  chosen,
  bedKey,
  placesUsed,
  unitsPerBed,
  onToggle,
}: JobPickerProps): JSX.Element {
  // Once the bed has a colour, everything that cannot share it is hidden rather
  // than greyed. A disabled row invites somebody to work out why it is disabled;
  // the honest answer — "this bed is blue now" — is already in the header.
  // Two different kinds of "cannot pick this", shown two different ways.
  //
  // Colour: once the bed has one, everything that cannot share it is HIDDEN. A
  // greyed row would invite working out why, and the answer - this bed is blue
  // now - is already in the header.
  //
  // Availability: those stay VISIBLE, greyed, with the reason. Somebody opens
  // this having just counted forty-three unfulfilled orders, and quietly
  // showing nine of them answers that with a shrug.
  const offered = bedKey ? jobs.filter(j => j.compatibility_key === bedKey || !j.available) : jobs

  if (jobs.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Nothing is outstanding. Every product from an unfulfilled order has been printed.
      </p>
    )
  }

  return (
    <div className="border-border max-h-80 overflow-y-auto rounded-md border">
      {offered.map(job => {
        const picked = chosen.includes(job.id)
        const units = job.quantity || 1
        // Full means full: a bed with three of four places cannot take a job of
        // two, and offering it only to refuse on create wastes the click.
        const wouldOverflow = !picked && placesUsed + units > unitsPerBed
        const blocked = !job.available || wouldOverflow
        return (
          <label
            key={job.id}
            className={`border-border flex items-center gap-3 border-b p-2 text-sm last:border-b-0 ${
              blocked ? 'opacity-50' : 'hover:bg-surface-muted cursor-pointer'
            }`}
          >
            <input
              type="checkbox"
              checked={picked}
              disabled={blocked}
              onChange={() => onToggle(job)}
              aria-label={`Add ${job.job_number} to this bed`}
            />
            <span className="font-mono text-xs tabular-nums">{job.job_number}</span>
            <span className="min-w-0 flex-1 truncate">
              {job.product_name ?? 'Untitled product'}
            </span>
            <span className="text-muted-foreground text-xs">{job.colour_label}</span>
            {/* The reason, where there is one. "Already on a locked bed
                BATCH-1000449" is the difference between a list that looks
                broken and one that is explaining the floor. */}
            {!job.available ? (
              <span className="text-subtle-foreground text-xs">
                {job.unavailable_reason}
                {job.on_bed ? ` ${job.on_bed}` : ''}
              </span>
            ) : job.reprint ? (
              // Already printed. Saying where it actually is matters more than
              // saying it can be picked: "waiting for QC" is usually the real
              // answer to why the order is still open, and printing a second
              // plank is a deliberate choice rather than the obvious one.
              <span className="text-warning text-xs">
                {job.finished_stage} — picking it reprints
              </span>
            ) : job.on_bed ? (
              // Where it is coming FROM. A locked bed is warned about rather
              // than refused: taking a plank off one pulls that bed's plate
              // out of the printer queue and gives its filament back before
              // rebuilding it, which is a fair thing to do and not a thing to
              // do by accident.
              <span
                className={
                  job.bed_locked ? 'text-warning text-xs' : 'text-subtle-foreground text-xs'
                }
              >
                {job.bed_locked ? `moves off locked ${job.on_bed}` : `on ${job.on_bed}`}
              </span>
            ) : null}
            {units > 1 ? <span className="font-mono text-xs tabular-nums">×{units}</span> : null}
          </label>
        )
      })}
      {/* Counts only what could actually still be added, so a list full of
          greyed locked-bed rows does not read as "there is more to pick". */}
      {bedKey && offered.filter(j => j.available && !chosen.includes(j.id)).length === 0 ? (
        <p className="text-muted-foreground p-3 text-center text-xs">
          Nothing else outstanding matches this bed.
        </p>
      ) : null}
    </div>
  )
}
