'use client'

import { ChevronRight } from 'lucide-react'
import type { JSX, ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface DisclosureProps {
  label: string
  /** A figure beside the label — a row count, usually. Omitted for none. */
  count?: number
  /** One line under the label, readable while the section is shut. */
  description?: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
}

/**
 * A section that opens.
 *
 * SHARED rather than copied: it started as a private helper on the product
 * card and is now the shape of two screens, and two of them would drift the
 * first time one grew a count and the other did not.
 *
 * The description is readable while the section is SHUT, which is the point of
 * it: a row of closed headings that say only "Printing files" and "Part files"
 * makes somebody open all of them to find out which one they want.
 */
export function Disclosure({
  label,
  count,
  description,
  open,
  onToggle,
  children,
}: DisclosureProps): JSX.Element {
  return (
    <div className="border-border flex flex-col border-t pt-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-2 text-left"
      >
        <ChevronRight
          className={cn('mt-0.5 size-4 shrink-0 transition-transform', open && 'rotate-90')}
          aria-hidden
        />
        <span className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
            {count === undefined ? null : (
              <span className="text-muted-foreground font-mono text-xs tabular-nums">{count}</span>
            )}
          </span>
          {description ? (
            <span className="text-muted-foreground text-sm text-pretty">{description}</span>
          ) : null}
        </span>
      </button>
      {open ? children : null}
    </div>
  )
}
