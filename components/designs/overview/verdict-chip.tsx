import type { JSX } from 'react'

import { cn } from '@/lib/utils'
import type { Verdict } from '@/lib/validators/designs'

const DOT: Record<Verdict, string> = {
  green: 'bg-success',
  yellow: 'bg-warning',
  red: 'bg-danger',
}

interface VerdictChipProps {
  verdict: Verdict
}

/**
 * The verdict on a lime tile. The theme's StatusPill tints are made for the
 * page surface and wash out on lime in dark mode, so this sits on ink in both
 * themes. The word carries the meaning; the dot only echoes it.
 */
export function VerdictChip({ verdict }: VerdictChipProps): JSX.Element {
  return (
    <span className="bg-landing-ink inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white uppercase">
      <span aria-hidden className={cn('size-2 rounded-full', DOT[verdict])} />
      {verdict}
    </span>
  )
}
