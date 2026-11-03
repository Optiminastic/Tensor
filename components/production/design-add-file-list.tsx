'use client'

import { AlertTriangle, Check, X } from 'lucide-react'
import type { JSX } from 'react'

import { skipReason, type DesignUploadCandidate } from '@/lib/design-upload-plan'

export interface DesignUploadOutcome {
  key: string
  ok: boolean
  /** The backend's own sentence when it refused. */
  error?: string
}

interface DesignAddFileListProps {
  candidates: DesignUploadCandidate[]
  /** Set once an upload has run, keyed by template key. */
  outcomes: Map<string, DesignUploadOutcome> | null
  onRemove: (fileName: string) => void
  disabled: boolean
}

/**
 * The batch, and what will happen to each file in it.
 *
 * Shown BEFORE anything is sent, which is the whole reason this exists.
 * Uploading nine files and finding out from the table afterwards that four
 * were skipped is how somebody concludes the upload is broken; naming the
 * four, with the reason, turns the same facts into two renames.
 *
 * After an upload it becomes the receipt, because a partial failure is the
 * case that needs one most: the files that went in stay in, and the person
 * needs to know which to pick again rather than re-dragging the folder.
 */
export function DesignAddFileList({
  candidates,
  outcomes,
  onRemove,
  disabled,
}: DesignAddFileListProps): JSX.Element | null {
  if (candidates.length === 0) return null

  return (
    <ul className="border-border divide-border divide-y rounded-2xl border">
      {candidates.map(candidate => {
        const outcome = outcomes?.get(candidate.key)
        const skipped = candidate.status !== 'ready'

        return (
          <li key={candidate.fileName} className="flex items-start gap-2 px-3 py-2">
            <StatusMark ok={outcome?.ok} skipped={skipped} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs" title={candidate.fileName}>
                {candidate.fileName}
              </p>
              {candidate.key !== '' ? (
                <p className="text-muted-foreground font-mono text-xs">{candidate.key}</p>
              ) : null}
              {/* The backend's own words when it refused: Tensor-Core names
                  the scope, the field or the missing number, and the person
                  reading this is the one who can act on that. */}
              {outcome?.ok === false ? (
                <p className="text-danger text-xs">{outcome.error ?? 'was refused'}</p>
              ) : null}
              {skipped && outcome === undefined ? (
                <p className="text-warning text-xs">{skipReason(candidate)}</p>
              ) : null}
            </div>

            {outcomes === null ? (
              <button
                type="button"
                aria-label={`Remove ${candidate.fileName}`}
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onRemove(candidate.fileName)}
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

/** Whether this file went in, is going, or is being left out. */
function StatusMark({ ok, skipped }: { ok?: boolean; skipped: boolean }): JSX.Element {
  if (ok === true) return <Check className="text-success mt-0.5 size-3.5 shrink-0" aria-hidden />
  if (ok === false) return <X className="text-danger mt-0.5 size-3.5 shrink-0" aria-hidden />
  if (skipped) {
    return <AlertTriangle className="text-warning mt-0.5 size-3.5 shrink-0" aria-hidden />
  }
  // Nothing has happened to it yet, and it is going to be sent. A tick here
  // would read as "already done".
  return <span className="bg-border mt-1.5 size-1.5 shrink-0 rounded-full" aria-hidden />
}
