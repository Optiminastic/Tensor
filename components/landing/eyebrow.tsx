import type { ReactNode, JSX } from 'react'

import { cn } from '@/lib/utils'

export interface EyebrowProps {
  children: ReactNode
  className?: string
}

/**
 * Section marker — "/ CAPABILITIES". Mono and letter-spaced so it reads as an
 * index entry rather than a heading, which keeps it out of the type hierarchy
 * the display face owns. The slash is ornament, so it is hidden from AT.
 */
export function Eyebrow({ children, className }: EyebrowProps): JSX.Element {
  return (
    <p
      className={cn(
        'text-subtle-foreground font-mono text-xs tracking-widest uppercase',
        className,
      )}
    >
      <span aria-hidden>/ </span>
      {children}
    </p>
  )
}
