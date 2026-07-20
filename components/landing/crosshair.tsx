import type { JSX } from 'react'

import { cn } from '@/lib/utils'

export interface CrosshairProps {
  className?: string
}

/**
 * The registration mark where two rules cross — the drafting-sheet gesture the
 * whole page is framed on. Purely decorative: it is centred on its anchor point
 * rather than offset from it, so it sits *on* the intersection.
 */
export function Crosshair({ className }: CrosshairProps): JSX.Element {
  return (
    <span
      aria-hidden
      className={cn(
        'text-border-strong pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2',
        'font-mono text-xs leading-none select-none',
        className,
      )}
    >
      +
    </span>
  )
}
