'use client'

import { AlertTriangle, Check, History } from 'lucide-react'
import { type JSX, useState } from 'react'

import {
  previewCatchUpAction,
  runCatchUpAction,
} from '@/app/dashboard/[brand]/production/packaging/catchup-actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CatchUpPreview, CatchUpResult } from '@/lib/validators/production-catchup'

interface CatchUpControlProps {
  brand: string
  /** production:catchup, which ADMIN alone holds. */
  canCatchUp: boolean
  onDone: () => void
}

/**
 * Marking the whole board done for goods that already shipped.
 *
 * THE ONE CONTROL IN TENSOR THAT DECLARES WORK FINISHED NOBODY DID. Everything
 * else on this page records something a person performed and saw - parts
 * combined, fit checked, packed. This records that the board was out of date,
 * and the screen says so in those words rather than offering a tidy "mark all
 * complete" that reads like the same act.
 *
 * THREE DELIBERATE STEPS. Preview the count, type a reason, then confirm. The
 * reason goes onto every job's permanent record, and the count is sent back to
 * the server so a sweep agreed for fifteen hundred jobs cannot quietly take
 * sixteen hundred if the floor finished something meanwhile.
 */
export function CatchUpControl({
  brand,
  canCatchUp,
  onDone,
}: CatchUpControlProps): JSX.Element | null {
  const [preview, setPreview] = useState<CatchUpPreview | null>(null)
  const [result, setResult] = useState<CatchUpResult | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canCatchUp) return null

  async function look(): Promise<void> {
    setBusy(true)
    setError(null)
    setResult(null)
    const res = await previewCatchUpAction(brand)
    setBusy(false)
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Could not read the station queues.')
      return
    }
    setPreview(res.data)
  }

  async function run(): Promise<void> {
    if (!preview) return
    setBusy(true)
    setError(null)
    const res = await runCatchUpAction({ brand, reason, confirm: preview.total })
    setBusy(false)
    if (!res.ok || !res.data) {
      // The backend's own sentence, which names the new count when the
      // queues moved - that is the thing to act on.
      setError(res.error ?? 'The catch-up could not be run.')
      return
    }
    setResult(res.data)
    setPreview(null)
    setReason('')
    onDone()
  }

  if (result) {
    return (
      <Card className="border-success/40 bg-success-subtle flex flex-col gap-1 p-4">
        <p className="text-foreground inline-flex items-center gap-2 text-sm">
          <Check className="text-success size-4" aria-hidden />
          Marked {result.advanced} {result.advanced === 1 ? 'job' : 'jobs'} done and recorded{' '}
          {result.dispatched} {result.dispatched === 1 ? 'order' : 'orders'} as shipped.
        </p>
        {result.failed > 0 ? (
          <p className="text-danger text-xs text-pretty">
            {result.failed} could not be marked and are still on the board.
          </p>
        ) : null}
        <p className="text-subtle-foreground text-xs text-pretty">
          Each one carries a note saying it was a bulk catch-up, not an inspection.
        </p>
      </Card>
    )
  }

  if (!preview) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-foreground text-sm font-medium">Board out of date?</p>
          <p className="text-muted-foreground max-w-prose text-sm text-pretty">
            If these orders already shipped without anybody clicking the stations, mark them done in
            one go. It records a catch-up, not an inspection.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void look()} disabled={busy}>
          <History className="size-3.5" aria-hidden />
          {busy ? 'Checking…' : 'Check what is waiting'}
        </Button>
        {error ? (
          <p role="alert" className="text-danger w-full text-sm text-pretty">
            {error}
          </p>
        ) : null}
      </Card>
    )
  }

  if (preview.total === 0) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground text-sm">
          Nothing is waiting at a station. The board is already up to date.
        </p>
      </Card>
    )
  }

  // Grouped so the number is attached to where the work is stuck, rather than
  // being one big figure somebody waves through.
  const byStation = preview.jobs.reduce<Record<string, number>>((acc, job) => {
    acc[job.waiting] = (acc[job.waiting] ?? 0) + 1
    return acc
  }, {})

  return (
    <Card className="border-danger/40 flex flex-col gap-4 p-5">
      <div className="flex items-start gap-2">
        <AlertTriangle className="text-danger mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <p className="text-foreground text-base font-medium">
            Mark {preview.total} {preview.total === 1 ? 'job' : 'jobs'} done without inspecting them
          </p>
          <p className="text-muted-foreground mt-1 max-w-prose text-sm text-pretty">
            This moves every job below straight to dispatched. No assembly, finishing, QC or
            packaging check is recorded, because nobody performed one — each job gets a note saying
            it was a bulk catch-up and who ran it. It cannot be undone.
          </p>
        </div>
      </div>

      <dl className="border-border flex flex-wrap gap-x-8 gap-y-2 border-y py-3 text-sm">
        {Object.entries(byStation).map(([station, count]) => (
          <div key={station} className="flex flex-col">
            <dt className="text-subtle-foreground text-xs">Waiting at {station}</dt>
            <dd className="text-foreground font-mono tabular-nums">{count}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="catchup-reason">Why</Label>
        <Input
          id="catchup-reason"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="These shipped before Tensor was used for the stations"
        />
        {/* It is written to every one of those jobs, permanently. */}
        <p className="text-subtle-foreground text-xs text-pretty">
          Goes onto all {preview.total} job records. Say what happened, so whoever reads one of
          these in six months knows why it has no inspection against it.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="danger"
          onClick={() => void run()}
          disabled={busy || reason.trim().length < 5}
        >
          {busy ? 'Marking…' : `Mark ${preview.total} done and dispatched`}
        </Button>
        <Button variant="ghost" onClick={() => setPreview(null)} disabled={busy}>
          Cancel
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-danger text-sm text-pretty">
          {error}
        </p>
      ) : null}
    </Card>
  )
}
