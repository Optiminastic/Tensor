'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type JSX } from 'react'

import { JobModelUploadButton } from '@/components/production/job-model-upload-button'
import { Button } from '@/components/ui/button'

/**
 * What an operator sees while Tensor is building a plank from the customer's
 * two names.
 *
 * It polls rather than sitting still. A render takes 20-45 seconds and there is
 * no push channel to this page, so without it the operator watches a static
 * "building..." message with no way to know whether it finished, and reaches
 * for the browser's reload button - or worse, concludes it is stuck and uploads
 * a model by hand that the system was about to produce.
 */
interface ModelGeneratingPanelProps {
  jobId: string
}

/**
 * Long enough not to hammer the server, short enough that a finished render
 * appears while the operator is still looking at the page. A render is 20-45s,
 * so this checks a handful of times over that window.
 */
const POLL_MS = 5_000

/**
 * When to stop polling on its own.
 *
 * A render that has not landed in five minutes is not slow, it is stuck - and a
 * page that polls for ever is a page left open overnight quietly making
 * requests. After this the operator gets an explicit way to look again.
 */
const GIVE_UP_MS = 5 * 60_000

export function ModelGeneratingPanel({ jobId }: ModelGeneratingPanelProps): JSX.Element {
  const router = useRouter()
  const [gaveUp, setGaveUp] = useState(false)

  useEffect(() => {
    if (gaveUp) return undefined

    // router.refresh() re-runs the server component; when the model has landed
    // the parent stops rendering this panel and shows the preview instead.
    const poll = setInterval(() => router.refresh(), POLL_MS)
    const stop = setTimeout(() => setGaveUp(true), GIVE_UP_MS)
    return () => {
      clearInterval(poll)
      clearTimeout(stop)
    }
  }, [router, gaveUp])

  return (
    <div className="flex flex-col items-center gap-4 px-6 text-center">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        {gaveUp ? null : <Loader2 className="size-4 animate-spin" aria-hidden />}
        <span role="status">
          {gaveUp
            ? 'This model is taking longer than expected.'
            : 'Creating the model from the customer’s names…'}
        </span>
      </div>

      <p className="text-subtle-foreground max-w-sm text-xs">
        {gaveUp
          ? 'Check again, or upload a model yourself if the render will not finish.'
          : 'It appears here when the render finishes, usually within a minute. Nothing to do.'}
      </p>

      {gaveUp ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => router.refresh()}>
            Check again
          </Button>
          {/* The escape hatch, offered only once waiting has stopped being
              reasonable - not while the render is still in flight, when it
              would invite somebody to duplicate work already under way. */}
          <JobModelUploadButton jobId={jobId} />
        </div>
      ) : null}
    </div>
  )
}
