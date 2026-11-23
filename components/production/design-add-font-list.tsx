'use client'

import { Check, Type, X } from 'lucide-react'
import type { JSX } from 'react'

export interface FontUploadOutcome {
  fileName: string
  ok: boolean
  /** The families Tensor read from the file, once it went in. */
  families?: string[]
  /** The backend's own sentence when it refused. */
  error?: string
}

interface DesignAddFontListProps {
  fonts: File[]
  /** Set once an upload has run, keyed by file name. */
  outcomes: Map<string, FontUploadOutcome> | null
  onRemove: (fileName: string) => void
  disabled: boolean
}

/**
 * The font files chosen alongside the designs, and what happened to each.
 *
 * Fonts are optional: one is only needed when a .scad names a family Tensor
 * does not ship, and Tensor-Core says which when it refuses that .scad. They
 * are uploaded before the designs, so a design that needs one goes in on the
 * same click.
 */
export function DesignAddFontList({
  fonts,
  outcomes,
  onRemove,
  disabled,
}: DesignAddFontListProps): JSX.Element | null {
  if (fonts.length === 0) return null

  return (
    <ul className="border-border divide-border divide-y rounded-2xl border" aria-label="Font files">
      {fonts.map(font => {
        const outcome = outcomes?.get(font.name)
        return (
          <li key={font.name} className="flex items-start gap-2 px-3 py-2">
            {outcome?.ok === true ? (
              <Check className="text-success mt-0.5 size-3.5 shrink-0" aria-hidden />
            ) : outcome?.ok === false ? (
              <X className="text-danger mt-0.5 size-3.5 shrink-0" aria-hidden />
            ) : (
              <Type className="text-muted-foreground mt-0.5 size-3.5 shrink-0" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs" title={font.name}>
                {font.name}
              </p>
              <p className="text-muted-foreground text-xs">
                {outcome?.families?.length
                  ? `Font family: ${outcome.families.join(' / ')}`
                  : 'Font — uploaded first'}
              </p>
              {outcome?.ok === false ? (
                <p className="text-danger text-xs">{outcome.error ?? 'was refused'}</p>
              ) : null}
            </div>
            {outcomes === null ? (
              <button
                type="button"
                aria-label={`Remove ${font.name}`}
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onRemove(font.name)}
                disabled={disabled}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
