'use client'

import { Upload } from 'lucide-react'
import { useId, useRef, useState, type JSX } from 'react'

import { uploadDesignTemplateAction } from '@/app/dashboard/[brand]/production/design-template-actions'
import { Button } from '@/components/ui/button'

interface DesignFileUploadProps {
  brand: string
  /**
   * The key the file is filed under in the Designs tab.
   *
   * Derived by the caller from the product, the part and the SKU, so a file
   * uploaded here is findable later by the name of the thing it draws rather
   * than by whatever the designer happened to call the file on their desk.
   * Uploading again under the same key makes a new VERSION, which is what
   * replacing a drawing should do - the old one stays readable in the history.
   */
  uploadKey: string
  /** Called with uploadKey once it is stored, so the caller can assign it. */
  onUploaded: (key: string) => void | Promise<void>
}

/**
 * Upload a .scad straight into a file slot.
 *
 * The registry could only ever POINT at a file somebody had already put in the
 * Designs tab. That is the right gesture for the second product that prints a
 * keychain and the wrong one for the first: configuring a new product meant
 * leaving the product, uploading three files, coming back and picking them out
 * of a list of ninety by a name you had to remember.
 *
 * So the slot that names a file can also receive one. Picking an existing file
 * stays exactly where it was, beside this - the two are not alternatives, they
 * are the first time and every time after.
 */
export function DesignFileUpload({
  brand,
  uploadKey,
  onUploaded,
}: DesignFileUploadProps): JSX.Element {
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(file: File): Promise<void> {
    setBusy(true)
    setError(null)
    const form = new FormData()
    form.set('file', file)
    const res = await uploadDesignTemplateAction(brand, uploadKey, form)
    setBusy(false)
    // Cleared either way, so choosing the same file twice after a failure
    // fires onChange again instead of looking like a dead button.
    if (input.current) input.current.value = ''
    if (!res.ok) {
      setError(res.error ?? 'Could not upload that file.')
      return
    }
    await onUploaded(uploadKey)
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={input}
        id={inputId}
        type="file"
        accept=".scad"
        className="sr-only"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) void send(file)
        }}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        <Upload className="size-3.5" aria-hidden />
        {busy ? 'Uploading…' : 'Upload'}
      </Button>
      {error ? (
        <p role="alert" className="text-danger text-xs text-pretty">
          {error}
        </p>
      ) : null}
    </div>
  )
}
