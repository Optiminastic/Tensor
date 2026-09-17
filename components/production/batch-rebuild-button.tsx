'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { rebuildBatch } from '@/app/dashboard/[brand]/production/batch-jobs-actions'
import { Button } from '@/components/ui/button'
import type { BatchRebuildResult } from '@/lib/validators/batches'

/**
 * Checks every model on a bed against the order it was built from, and rebuilds
 * the ones that disagree.
 *
 * A model is built once and then nothing looks at it again - which was fine
 * until a job could read the wrong order line. One bed printed NAVYA & KRISHNA
 * four times against three other customers' orders, and nothing anywhere said
 * so. This asks the question on demand.
 *
 * It reports what it found rather than only what it did: the jobs it is
 * rebuilding, each with the difference that condemned it, and the count that
 * were already correct. "Three of these are fine" is the half an operator has to
 * be able to believe before trusting the bed.
 */
interface BatchRebuildButtonProps {
  brand: string
  batchId: string
}

export function BatchRebuildButton({ brand, batchId }: BatchRebuildButtonProps): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<BatchRebuildResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function check(): Promise<void> {
    setPending(true)
    setError(null)
    setResult(null)
    const res = await rebuildBatch(brand, batchId)
    setPending(false)

    if (!res.ok || !res.data) {
      setError(res.error ?? "Could not check this batch's models.")
      return
    }
    setResult(res.data)
    // Renders take 20-45 seconds each, so nothing has changed yet - this picks
    // up the jobs' new status rather than their new models.
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" variant="secondary" disabled={pending} onClick={() => void check()}>
        <RefreshCw className="size-3.5" aria-hidden />
        {pending ? 'Checking…' : 'Rebuild batch'}
      </Button>

      {error ? (
        <p role="alert" className="text-danger max-w-xs text-right text-xs">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="flex max-w-xs flex-col items-end gap-1 text-right">
          <p className="text-muted-foreground text-xs">{result.note}</p>
          {/* Named, not counted: the reason is what tells an operator whether
              the rebuild is fixing the plank they were worried about. */}
          {result.queued.map(job => (
            <p key={job.job_number} className="text-xs">
              <span className="font-mono tabular-nums">{job.job_number}</span>{' '}
              <span className="text-muted-foreground">{job.reason}</span>
            </p>
          ))}
          {result.correct.length > 0 ? (
            <p className="text-muted-foreground text-xs">
              {result.correct.length} already correct: {result.correct.join(', ')}
            </p>
          ) : null}
          {result.skipped.map(job => (
            <p key={job.job_number} className="text-muted-foreground text-xs">
              <span className="font-mono tabular-nums">{job.job_number}</span> skipped —{' '}
              {job.reason}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  )
}
