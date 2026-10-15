'use client'

import { ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { useState, type JSX } from 'react'

import { Switch } from '@/components/ui/switch'
import { removeImageBackground } from '@/lib/remove-background'

import { DropZone } from './drop-zone'

interface PreviewImageZoneProps {
  // Emits the file the form should upload: the background-removed PNG, or the
  // original when the toggle is off or removal fails. Null while none is chosen
  // or while the cut-out is still being made, which blocks submitting.
  onChange: (file: File | null) => void
  hint: string
}

/**
 * The cover picker. On selection it strips the image background on-device, so
 * cards read like a clean product catalog, and shows the result in the zone.
 * Removal can be turned off; a failed removal falls back to the original.
 */
export function PreviewImageZone({ onChange, hint }: PreviewImageZoneProps): JSX.Element {
  const [removeBg, setRemoveBg] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [shown, setShown] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [raw, setRaw] = useState<File | null>(null)

  function emit(file: File | null): void {
    onChange(file)
    setShown(previous => {
      if (previous) URL.revokeObjectURL(previous)
      return file ? URL.createObjectURL(file) : null
    })
  }

  async function apply(file: File | null, strip: boolean): Promise<void> {
    setNote(null)
    if (file && !file.type.startsWith('image/')) return setNote('The preview must be an image.')
    if (!file || !strip) return emit(file)
    onChange(null)
    setProcessing(true)
    try {
      emit(await removeImageBackground(file))
    } catch {
      setNote('Could not remove the background, so the original image is used.')
      emit(file)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <DropZone
        id="preview-image"
        accept="image/*"
        prompt="Drop a product photo, or browse"
        hint={hint}
        icon={<ImageIcon className="size-5" aria-hidden />}
        onFile={file => {
          setRaw(file)
          void apply(file, removeBg)
        }}
      >
        {shown && !processing ? (
          <span className="relative block h-32 w-full">
            <Image src={shown} alt="Chosen preview" fill unoptimized className="object-contain" />
          </span>
        ) : processing ? (
          <span className="text-muted-foreground relative text-sm">Removing the background...</span>
        ) : undefined}
      </DropZone>
      <label className="text-muted-foreground flex items-center gap-2 text-sm">
        <Switch
          checked={removeBg}
          disabled={processing}
          onCheckedChange={checked => {
            setRemoveBg(checked)
            void apply(raw, checked)
          }}
        />
        Remove the background automatically
      </label>
      {note ? <p className="text-warning text-sm">{note}</p> : null}
    </div>
  )
}
