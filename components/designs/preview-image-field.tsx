'use client'

import Image from 'next/image'
import { useState, type ChangeEvent, type JSX } from 'react'

import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { removeImageBackground } from '@/lib/remove-background'

interface PreviewImageFieldProps {
  // Emits the file the form should upload: the background-removed PNG, or the
  // original when the toggle is off or removal fails. Null while none is chosen.
  onChange: (file: File | null) => void
  hint: string
  optional: boolean
}

/**
 * The design preview picker. On selection it strips the image background on-device
 * (so cards read like a clean product catalog) and shows a live thumbnail on the
 * same surface the gallery uses. The user can turn removal off, and a failed
 * removal silently falls back to the original image.
 */
export function PreviewImageField({
  onChange,
  hint,
  optional,
}: PreviewImageFieldProps): JSX.Element {
  const [removeBg, setRemoveBg] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [rawFile, setRawFile] = useState<File | null>(null)

  async function apply(file: File | null, strip: boolean): Promise<void> {
    setNote(null)
    if (!file) {
      emit(null)
      return
    }
    if (!strip) {
      emit(file)
      return
    }
    onChange(null) // block submit until the cut-out is ready
    setProcessing(true)
    try {
      emit(await removeImageBackground(file))
    } catch {
      setNote('Could not remove the background - using the original image.')
      emit(file)
    } finally {
      setProcessing(false)
    }
  }

  function emit(file: File | null): void {
    onChange(file)
    setPreviewUrl(previous => {
      if (previous) URL.revokeObjectURL(previous)
      return file ? URL.createObjectURL(file) : null
    })
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null
    setRawFile(file)
    void apply(file, removeBg)
  }

  function handleToggle(checked: boolean): void {
    setRemoveBg(checked)
    void apply(rawFile, checked)
  }

  return (
    <Field label="Preview image" htmlFor="preview" hint={hint} required={!optional}>
      <Input id="preview" type="file" accept="image/*" onChange={handleFile} />

      <label className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
        <Switch checked={removeBg} onCheckedChange={handleToggle} disabled={processing} />
        Remove background automatically
      </label>

      {processing ? (
        <p className="text-muted-foreground mt-2 text-sm">Removing background…</p>
      ) : null}
      {note ? <p className="text-warning mt-2 text-sm">{note}</p> : null}

      {previewUrl ? (
        <div className="border-border bg-surface-muted relative mt-3 h-40 w-full overflow-hidden rounded-md border">
          <Image
            src={previewUrl}
            alt="Design preview"
            fill
            unoptimized
            className="object-contain p-3"
          />
        </div>
      ) : null}
    </Field>
  )
}
