'use client'

import Image from 'next/image'
import { useRef, type JSX } from 'react'

import { Button } from '@/components/ui/button'
import { useLogoUpload } from '@/hooks/use-logo-upload'

interface LogoUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  idPrefix?: string
}

/**
 * A square logo picker: shows the current logo (or a placeholder), uploads the
 * chosen file to /api/brands/logo, and hands the resulting URL back to the form.
 */
export function LogoUpload({ value, onChange, idPrefix = 'logo' }: LogoUploadProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading, error } = useLogoUpload()

  async function onPick(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0]
    event.target.value = '' // allow re-picking the same file
    if (!file) return
    try {
      const url = await upload(file)
      onChange(url)
    } catch {
      // error is surfaced by the hook; nothing else to do here.
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="border-border bg-surface-muted relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border">
        {value ? (
          <Image src={value} alt="Brand logo" fill sizes="64px" className="object-contain" />
        ) : (
          <span className="text-subtle-foreground text-xs">No logo</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            id={`${idPrefix}-file`}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={onPick}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Uploading…' : value ? 'Replace logo' : 'Upload logo'}
          </Button>
          {value ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              Remove
            </Button>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="text-danger text-xs">
            {error}
          </p>
        ) : (
          <p className="text-subtle-foreground text-xs">PNG, JPG or WebP, up to 2 MB.</p>
        )}
      </div>
    </div>
  )
}
