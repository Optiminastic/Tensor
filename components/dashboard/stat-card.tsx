import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { JSX, ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import type { TrendDelta, TrendDirection } from '@/lib/dashboard/analytics'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: string
  accent?: string // CSS var for the top accent rule, e.g. 'var(--accent)'
  delta?: TrendDelta | null
}

const DIRECTION: Record<TrendDirection, { icon: typeof Minus; className: string }> = {
  up: { icon: ArrowUpRight, className: 'text-success bg-success-subtle' },
  down: { icon: ArrowDownRight, className: 'text-danger bg-danger-subtle' },
  flat: { icon: Minus, className: 'text-muted-foreground bg-surface-muted' },
}

/**
 * A KPI tile with presence: a hairline accent rule on top, the figure in mono, and
 * an optional week-over-week chip (arrow + label, never colour alone).
 */
export function StatCard({ label, value, hint, accent, delta }: StatCardProps): JSX.Element {
  const direction = delta ? DIRECTION[delta.direction] : null
  const Icon = direction?.icon

  return (
    <Card className="relative overflow-hidden p-5">
      {accent ? (
        <span
          className="absolute inset-x-0 top-0 h-0.5"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <p className="text-subtle-foreground text-xs font-medium tracking-wide uppercase">
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
      <p className="text-foreground mt-3 font-mono text-3xl font-medium tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? <p className="text-muted-foreground mt-1.5 text-xs">{hint}</p> : null}
    </Card>
  )
}
