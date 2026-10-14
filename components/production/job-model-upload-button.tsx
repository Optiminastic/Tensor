'use client'

import { Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState, type ChangeEvent, type JSX, type MouseEvent } from 'react'

import { uploadJobModelAction } from '@/app/dashboard/[brand]/production/job-model-actions'
import { Button } from '@/components/ui/button'

/**
 * Attaches a model file to a job that Tensor cannot build itself.
 *
 * A Dual Name Plank is rendered from the customer's own two names and never
 * needs this. Every other product does: somebody has to supply the geometry
 * before the job can be printed, and until they do the job sits out of
 * batching. So this is the approval step as much as an upload - one action,
 * not "upload somewhere, then approve".
 *
 * A hidden input behind a button rather than a bare file field: the row is
 * already dense, and a native file input would be the widest control in it.
 */
interface JobModelUploadButtonProps {
  jobId: string
  /** Shown compactly in a table row, roomier on a detail page. */
  size?: 'sm' | 'md'
  /** Wording for a job that already has a model - the upload replaces it. */
  hasModel?: boolean
}

const ACCEPTED = '.stl,.3mf'

export function JobModelUploadButton({
  jobId,
  size = 'sm',
  hasModel = false,
}: JobModelUploadButtonProps): JSX.Element {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The row itself navigates to the job; the button must not.
  function stopRowClick(event: MouseEvent): void {
    event.stopPropagation()
  }

  async function upload(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0]
    // Reset immediately: without this, choosing the same file twice after a
    // failure fires no change event and the button looks dead.
    event.target.value = ''
    if (!file) return

    setPending(true)
    setError(null)
    const form = new FormData()
    form.set('file', file)
    const result = await uploadJobModelAction(jobId, form)
    setPending(false)

    if (!result.ok) {
      setError(result.error ?? 'Could not upload the model file.')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1" onClick={stopRowClick}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={event => void upload(event)}
      />
      <Button
        type="button"
        variant="secondary"
        size={size === 'sm' ? 'sm' : undefined}
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-3.5" aria-hidden />
        {pending ? 'Uploading…' : hasModel ? 'Replace model' : 'Upload model'}
      </Button>
      {error ? (
        <p role="alert" className="text-danger max-w-52 text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}
