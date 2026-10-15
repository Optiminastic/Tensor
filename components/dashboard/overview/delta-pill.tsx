import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import type { JSX } from 'react'

import type { TrendDelta } from '@/lib/dashboard/analytics'
import { cn } from '@/lib/utils'

interface DeltaPillProps {
  delta: TrendDelta | null
  /** For tiles whose own background is lime, where a lime pill would vanish. */
  onLime?: boolean
}

const ICONS = { up: ArrowUpRight, down: ArrowDownRight, flat: ArrowRight }

/** Week-over-week change. The arrow carries the direction, not the colour alone. */
export function DeltaPill({ delta, onLime }: DeltaPillProps): JSX.Element | null {
  if (!delta) return null
  const Icon = ICONS[delta.direction]
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs tabular-nums',
        onLime ? 'bg-landing-ink text-white' : 'bg-landing-lime text-landing-ink',
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {delta.label}
      <span className="sr-only">
        {delta.direction === 'flat' ? 'unchanged' : delta.direction} vs last week
      </span>
    </span>
  )
}
