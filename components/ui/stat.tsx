import type { ReactNode, JSX } from 'react'

import { cn } from '@/lib/utils'

export interface StatProps {
  label: string
  value: ReactNode
  hint?: string
  className?: string
}

/**
 * A KPI tile: an uppercase micro-label over a large tabular figure.
 * Used across the Admin, Project Lead and Operator dashboards.
 */
export function Stat({ label, value, hint, className }: StatProps): JSX.Element {
  return (
    <div className={cn('border-border bg-surface rounded-lg border p-4 shadow-xs', className)}>
      <p className="text-subtle-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      <p className="text-foreground mt-2 font-mono text-2xl font-medium tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
    </div>
  )
}
