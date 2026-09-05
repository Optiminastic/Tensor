import type { JSX } from 'react'

import { cn } from '@/lib/utils'

/**
 * Why a row in the production pipeline is stuck.
 *
 * One component for all four surfaces - order, job, batch, machine - because
 * the pipeline's failures are one idea and an operator scanning the pages
 * should not have to learn a different visual language on each. It is the
 * reading half of the treatment; `failureRowClass` below is the row half.
 *
 * The reason is always rendered, never hidden behind a `title` tooltip: a
 * tooltip is unreachable on touch and invisible to someone scanning a table,
 * which is exactly the moment this text exists for. That also keeps severity
 * off colour alone, the rule `components/dashboard/attention-card.tsx` sets.
 */
interface FailureNoteProps {
  /** Null or empty renders nothing, so callers need no conditional. */
  reason: string | null | undefined
  /** Prefix naming the stage, e.g. "Slice failed". Omitted when the reason already says. */
  label?: string
  /**
   * How loud the note is.
   *
   * `danger` for something that has stopped: a batch that will not print, a job
   * that failed. `advice` for something a working row still needs from a person
   * - a printer whose last print failed is available and scheduled, but the
   * plate wants clearing. Rendering that in the same red as a stoppage is how a
   * board ends up with five alarming rows that mean "carry on".
   */
  tone?: 'danger' | 'advice'
  className?: string
}

export function FailureNote({
  reason,
  label,
  tone = 'danger',
  className,
}: FailureNoteProps): JSX.Element | null {
  const text = reason?.trim()
  if (!text) return null

  return (
    <p
      role="status"
      className={cn(
        'text-xs leading-snug',
        tone === 'danger' ? 'text-danger' : 'text-muted-foreground',
        className,
      )}
    >
      {label ? <span className="font-medium">{label}: </span> : null}
      {text}
    </p>
  )
}

/**
 * The row treatment for a failed row: a tint plus a left border.
 *
 * Matches the severity border in `attention-card.tsx` rather than inventing a
 * second convention. The tint is deliberately faint - a table where four rows
 * have failed should still be readable as a table.
 */
export function failureRowClass(failed: boolean): string {
  return failed ? 'bg-danger-subtle/40 border-l-danger border-l-2' : ''
}
