import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { JSX, ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import type { TrendDelta, TrendDirection } from '@/lib/dashboard/analytics'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: string
  /** Kept for callers; the tile no longer draws a coloured rule. */
  accent?: string
  delta?: TrendDelta | null
}

const DIRECTION: Record<TrendDirection, { icon: typeof Minus; className: string }> = {
  up: { icon: ArrowUpRight, className: 'text-success bg-success-subtle' },
  down: { icon: ArrowDownRight, className: 'text-danger bg-danger-subtle' },
  flat: { icon: Minus, className: 'text-muted-foreground bg-surface-muted' },
}

/**
 * A KPI tile in the landing UI: a mono label, a large figure, and an optional
 * week-over-week chip (arrow + label, never colour alone).
 */
export function StatCard({ label, value, hint, delta }: StatCardProps): JSX.Element {
  const direction = delta ? DIRECTION[delta.direction] : null
  const Icon = direction?.icon

  return (
    <Card className="relative overflow-hidden p-6">
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground font-mono text-xs tracking-[0.16em] uppercase">
          {label}
        </p>
        {delta && direction && Icon ? (
          <span
            className={cn(
              'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[0.65rem] font-medium tabular-nums',
              direction.className,
            )}
          >
            <Icon className="size-3" aria-hidden />
            {delta.label}
          </span>
        ) : null}
      </div>
      <p className="text-foreground mt-4 text-4xl font-medium tracking-[-0.04em] tabular-nums">
        {value}
      </p>
      {hint ? <p className="text-muted-foreground mt-1.5 text-xs">{hint}</p> : null}
    </Card>
  )
}
