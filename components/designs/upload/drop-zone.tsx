'use client'

import { useState, type DragEvent, type JSX, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { LayerTexture } from '../layer-texture'

interface DropZoneProps {
  id: string
  accept: string
  /** What the zone says while empty, e.g. "Drop the model file". */
  prompt: string
  hint: string
  icon: ReactNode
  onFile: (file: File | null) => void
  /** Shown instead of the prompt once a file is chosen. */
  children?: ReactNode
}

/**
 * A file picker as a drop target: drag a file onto it, or click (or focus and
 * press Enter) to browse. The real input stays in the tab order, visually
 * hidden; the zone shows its focus ring. A dropped file skips the browser's
 * `accept` filter, so the caller still checks what it got.
 */
export function DropZone(props: DropZoneProps): JSX.Element {
  const { id, accept, prompt, hint, icon, onFile, children } = props
  const [over, setOver] = useState(false)

  function drop(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault()
    setOver(false)
    onFile(event.dataTransfer.files[0] ?? null)
  }

  return (
    <label
      htmlFor={id}
      onDragOver={event => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
      className={cn(
        'bg-surface-muted relative flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border-2 border-dashed p-6 text-center transition-colors',
        'focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-2',
        over ? 'border-foreground' : 'border-border-strong hover:border-foreground/60',
      )}
    >
      <LayerTexture />
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={event => onFile(event.target.files?.[0] ?? null)}
      />
      {children ?? (
        <span className="relative flex flex-col items-center gap-3">
          <span className="bg-surface ring-border grid size-12 place-items-center rounded-2xl ring-1">
            {icon}
          </span>
          <span className="text-sm font-medium">{prompt}</span>
          <span className="text-muted-foreground text-xs">{hint}</span>
        </span>
      )}
    </label>
  )
}
