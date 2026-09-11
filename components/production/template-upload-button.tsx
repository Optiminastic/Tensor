'use client'

import { Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState, type ChangeEvent, type JSX } from 'react'

import { uploadDesignTemplateAction } from '@/app/dashboard/[brand]/production/design-template-actions'
import { Button } from '@/components/ui/button'

interface TemplateUploadButtonProps {
  brand: string
  templateKey: string
  /** Wording for the control. "Replace" where a file already prints. */
  label?: string
}

/**
 * Replaces the file a design template renders from.
 *
 * A hidden input behind a button, matching JobModelUploadButton: a native file
 * field would be the widest control in an already dense row.
 *
 * Lives beside the product it belongs to rather than in a list of its own,
 * because a template key means nothing alone - "dnp_two_heart" is only legible
 * next to the product whose two-heart variant prints from it.
 */
export function TemplateUploadButton({
  brand,
  templateKey,
  label = 'Replace',
}: TemplateUploadButtonProps): JSX.Element {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  async function upload(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0]
    // Reset immediately: without this, choosing the same file twice after a
    // failure fires no change event and the button looks dead.
    event.target.value = ''
    if (!file) return

    setPending(true)
    setMessage(null)
    setFailed(false)

    const form = new FormData()
    form.set('file', file)
    const result = await uploadDesignTemplateAction(brand, templateKey, form)
    setPending(false)

    if (!result.ok) {
      setFailed(true)
      setMessage(result.error ?? 'Could not upload the template.')
      return
    }
    setMessage(`Now rendering from v${result.data?.version ?? '?'}`)
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".scad"
        className="hidden"
        onChange={event => void upload(event)}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-3.5" aria-hidden />
        {pending ? 'Uploading…' : label}
      </Button>
      {message ? (
        <p
          role="status"
          className={`max-w-56 text-right text-xs ${failed ? 'text-danger' : 'text-muted-foreground'}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
