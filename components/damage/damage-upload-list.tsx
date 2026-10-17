'use client'

import { Check, RotateCw, Upload } from 'lucide-react'
import type { ChangeEvent, JSX } from 'react'

import type { UploadRow } from '@/hooks/use-damage-uploads'
import { cn } from '@/lib/utils'

/**
 * Everything a phone's camera roll will offer.
 *
 * `capture` is deliberately NOT set: it would open the camera instead of the
 * gallery, and the photographs of a damaged parcel were usually taken when
 * the box was opened, not now.
 */
const ACCEPTED = 'image/*,video/*'

interface DamageUploadListProps {
  rows: UploadRow[]
  maxFiles: number
  maxFileMB: number
  onPick: (files: File[]) => void
  onRetry: (key: string) => void
}

export function DamageUploadList({
  rows,
  maxFiles,
  maxFileMB,
  onPick,
  onRetry,
}: DamageUploadListProps): JSX.Element {
  const used = rows.filter(r => r.state !== 'failed').length
  const full = used >= maxFiles

  function choose(event: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(event.target.files ?? [])
    // Cleared so picking the same file twice still fires a change event -
    // which is exactly what somebody does after a failed upload.
    event.target.value = ''
    if (files.length > 0) onPick(files)
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        className={cn(
          'border-border/70 flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition',
          full ? 'opacity-50' : 'hover:border-foreground/40 cursor-pointer',
        )}
      >
        <Upload className="text-subtle-foreground size-5" aria-hidden />
        <span className="text-sm font-medium">
          {rows.length === 0 ? 'Add photos or a video' : 'Add more'}
        </span>
        {/* THE LIMITS ARE STATED, not discovered. Finding out a video was too
            large after two minutes of uploading it on a phone connection is
            the worst version of this page. */}
        <span className="text-subtle-foreground text-xs text-pretty">
          {full
            ? `That is all ${maxFiles} — send the rest on WhatsApp if you need to.`
            : `You can pick several at once · up to ${maxFiles} files · ${maxFileMB} MB each`}
        </span>
        <input
          type="file"
          accept={ACCEPTED}
          multiple
          disabled={full}
          className="hidden"
          onChange={choose}
        />
      </label>

      {rows.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {rows.map(row => (
            <Row key={row.key} row={row} onRetry={() => onRetry(row.key)} />
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function Row({ row, onRetry }: { row: UploadRow; onRetry: () => void }): JSX.Element {
  return (
    <li className="bg-surface-muted flex flex-col gap-1.5 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-3 text-sm">
        <span className="min-w-0 flex-1 truncate">{row.name}</span>
        {row.state === 'done' ? (
          <Check className="text-success size-4 shrink-0" aria-label="Sent" />
        ) : row.state === 'uploading' ? (
          <span className="text-subtle-foreground shrink-0 font-mono text-xs tabular-nums">
            {row.percent}%
          </span>
        ) : (
          <button
            type="button"
            onClick={onRetry}
            className="text-accent inline-flex shrink-0 items-center gap-1 text-xs underline-offset-4 hover:underline"
          >
            <RotateCw className="size-3" aria-hidden />
            Try again
          </button>
        )}
      </div>

      {row.state === 'uploading' ? (
        <div className="bg-border h-1 w-full overflow-hidden rounded-full">
          <div
            className="bg-accent h-full rounded-full transition-[width] duration-200"
            style={{ width: `${row.percent}%` }}
          />
        </div>
      ) : null}

      {row.error ? <p className="text-danger text-xs text-pretty">{row.error}</p> : null}
    </li>
  )
}
