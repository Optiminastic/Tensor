'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX, type MouseEvent } from 'react'

import { rerenderJobModelAction } from '@/app/dashboard/[brand]/production/job-model-actions'
import { Button } from '@/components/ui/button'

/**
 * Rebuilds a generated job's model from the customer's own order line.
 *
 * Re-rendering lived only in a container binary, so from the floor there was no
 * way to rebuild a model at all. That was tolerable while the only reason to
 * re-render was a template fix - a deploy-time event somebody with a shell was
 * doing anyway - and stopped being tolerable when a single job could be wrong on
 * its own: an operator looking at a plank that read NAVYA & KRISHNA against an
 * order for APRAJITA & AJAY had nothing to press.
 *
 * Offered on a completed job too, deliberately. That plank is already on a
 * shelf and no file will change it - but the model is what a reprint is built
 * from and what this page shows the next person who opens it, so correcting the
 * record is the reason to ask.
 *
 * Only for products Tensor renders. An uploaded design has no template to
 * rebuild from, and the backend says so rather than queueing work that cannot
 * succeed; the caller keeps the button out of sight in that case.
 */
interface JobRerenderButtonProps {
  jobId: string
  /** Compact in a table row, roomier on a detail page. */
  size?: 'sm' | 'md'
}

export function JobRerenderButton({ jobId, size = 'sm' }: JobRerenderButtonProps): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queued, setQueued] = useState(false)

  // Where this sits in a table, the row itself navigates to the job.
  function stopRowClick(event: MouseEvent): void {
    event.stopPropagation()
  }

  async function rerender(): Promise<void> {
    setPending(true)
    setError(null)
    const result = await rerenderJobModelAction(jobId)
    setPending(false)

    if (!result.ok) {
      setError(result.error ?? 'Could not queue the render.')
      return
    }
    // The render is queued, not done: OpenSCAD takes 20-45 seconds on the
    // worker. Saying "queued" rather than flipping to a finished state is the
    // honest report, and refresh picks up the job's new status.
    setQueued(true)
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1" onClick={stopRowClick}>
      <Button
        type="button"
        variant="secondary"
        size={size === 'sm' ? 'sm' : undefined}
        disabled={pending}
        onClick={() => void rerender()}
      >
        <RefreshCw className="size-3.5" aria-hidden />
        {pending ? 'Queueing…' : queued ? 'Render queued' : 'Rebuild model'}
      </Button>
      {error ? (
        <p role="alert" className="text-danger max-w-52 text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}
