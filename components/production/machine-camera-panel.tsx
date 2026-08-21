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
export function MachineCameraPanel({
  machineId,
  machineName,
}: MachineCameraPanelProps): JSX.Element {
  const [live, setLive] = useState(false)
  const [failed, setFailed] = useState(false)
  // Bumped on each start so the browser re-requests instead of reusing a dead
  // connection it already has cached for this URL.
  const [attempt, setAttempt] = useState(0)

  function toggle(): void {
    setFailed(false)
    if (live) {
      setLive(false)
      return
    }
    setAttempt(n => n + 1)
    setLive(true)
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
          {failed ? (
            <p role="alert" className="text-danger px-3 py-6 text-center text-xs">
              The camera stream could not be started. The printer may be offline, or its camera
              disabled in BambuBuddy.
            </p>
          ) : (
            <img
              key={attempt}
              src={`/api/machines/${encodeURIComponent(machineId)}/camera?fps=2&t=${attempt}`}
              alt={`Live camera feed from ${machineName}`}
              className="max-h-[420px] w-full object-contain"
              onError={() => setFailed(true)}
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
