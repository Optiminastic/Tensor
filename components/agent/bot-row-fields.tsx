import type { JSX } from 'react'

import { cn } from '@/lib/utils'

/**
 * Characters used, against WhatsApp's cap.
 *
 * Mono tabular so it does not jiggle as it counts, and it turns red before
 * the save is refused rather than after: Meta rejects the whole message over
 * one long row and names neither the row nor the rule.
 */
export function Counter({ length, max }: { length: number; max: number }): JSX.Element {
  return (
    <span
      className={cn(
        'font-mono text-[11px] tabular-nums',
        length > max ? 'text-danger' : 'text-subtle-foreground',
      )}
    >
      {length}/{max}
    </span>
  )
}
