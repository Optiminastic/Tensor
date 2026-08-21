'use client'

import { Video, VideoOff } from 'lucide-react'
import { useState, type JSX } from 'react'

import { Button } from '@/components/ui/button'

interface MachineCameraPanelProps {
  machineId: string
  machineName: string
}

/**
 * The printer's live camera, off until asked for.
 *
 * Default OFF is the whole design. Every frame travels from a printer on a home
 * network, across Tailscale, through the VPS, to the browser - so an
 * always-on feed would spend that link continuously for a page people mostly
 * open to read numbers off. It also keeps the camera itself idle unless someone
 * is actually looking.
 *
 * The feed is an <img> rather than a <video>: the source is MJPEG
 * (multipart/x-mixed-replace), which browsers render natively in an image tag
 * and not at all in a video element.
 */
// Bounded so a stream that fails instantly cannot spin. Enough to cover a long
// watch across several serverless-function expiries, few enough that a genuine
// fault surfaces to the operator instead of retrying forever.
const MAX_AUTO_RECONNECTS = 20

/** The proxy URL for one machine's feed. `t` defeats the browser's cache so a
 *  retry opens a new connection instead of reusing a dead one. */
function cameraUrl(machineId: string, attempt: number): string {
  return `/api/machines/${encodeURIComponent(machineId)}/camera?fps=2&t=${attempt}`
}

export function MachineCameraPanel({
  machineId,
  machineName,
}: MachineCameraPanelProps): JSX.Element {
  const [live, setLive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Consecutive automatic reconnects. Reset by a successful start and by the
  // operator toggling, so a long watch does not slowly exhaust the budget.
  const [reconnects, setReconnects] = useState(0)
  // Bumped on each start so the browser re-requests instead of reusing a dead
  // connection it already has cached for this URL.
  const [attempt, setAttempt] = useState(0)

  function toggle(): void {
    setError(null)
    setReconnects(0)
    if (live) {
      setLive(false)
      return
    }
    setAttempt(n => n + 1)
    setLive(true)
  }

  /**
   * Finds out WHY the feed failed, and says so.
   *
   * An <img> onError reports only that something went wrong - never a status
   * or a body - so a single generic sentence had to cover a missing route, an
   * expired session, an unconfigured BambuBuddy and a genuinely offline
   * printer. Those need completely different fixes, and guessing "the printer
   * may be offline" sent people to check the printer when the real answer was
   * that the backend had not been redeployed.
   *
   * So on failure the same URL is re-requested with fetch, which does expose
   * the status and the {detail} the proxy passes through from Tensor-Core.
   */
  async function explainFailure(): Promise<void> {
    setError('The camera stream stopped. Checking why…')
    // Aborted the moment the status is known. This request is asking a
    // question, not watching a feed - and a successful one returns an endless
    // MJPEG body, so leaving it open would start a second stream from the
    // printer that nobody ever reads.
    const probe = new AbortController()
    try {
      const res = await fetch(cameraUrl(machineId, attempt), {
        cache: 'no-store',
        signal: probe.signal,
      })
      if (res.ok) {
        probe.abort()
        // The endpoint answers when asked directly, so nothing is misconfigured
        // - the stream itself ended. On Vercel that is expected roughly every
        // five minutes, because the proxy is a serverless function with a
        // wall-clock budget and a live feed never finishes on its own. Silently
        // reconnecting is the honest response to a limit we know about; making
        // the operator re-toggle every five minutes would be pretending it is
        // their problem.
        if (reconnects < MAX_AUTO_RECONNECTS) {
          setReconnects(n => n + 1)
          setAttempt(n => n + 1)
          setError(null)
          return
        }
        setError('The camera stream keeps dropping. Turn it off and on again to retry.')
        return
      }
      const body: unknown = await res.json().catch(() => null)
      const detail =
        typeof body === 'object' && body !== null && 'detail' in body
          ? String((body as { detail: unknown }).detail)
          : null
      setError(
        detail ??
          (res.status === 404
            ? 'The camera endpoint does not exist on this deployment. The backend may need redeploying.'
            : `The camera stream failed (HTTP ${res.status}).`),
      )
    } catch {
      setError('Could not reach Tensor to start the camera stream.')
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Live camera</h2>
        <Button type="button" variant="secondary" size="sm" onClick={toggle}>
          {live ? (
            <VideoOff className="size-3.5" aria-hidden />
          ) : (
            <Video className="size-3.5" aria-hidden />
          )}
          {live ? 'Turn off' : 'Turn on'}
        </Button>
      </div>

      {live ? (
        <div className="bg-surface-muted relative overflow-hidden rounded-md">
          {error ? (
            <p role="alert" className="text-danger px-3 py-6 text-center text-xs">
              {error}
            </p>
          ) : (
            <img
              key={attempt}
              src={cameraUrl(machineId, attempt)}
              alt={`Live camera feed from ${machineName}`}
              className="max-h-[420px] w-full object-contain"
              onError={() => void explainFailure()}
            />
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          Off. Turning it on streams live video from the printer, which uses roughly 0.6 MB/s of its
          network connection.
        </p>
      )}
    </section>
  )
}
