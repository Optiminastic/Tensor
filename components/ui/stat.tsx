import type { ReactNode, JSX } from 'react'

import { cn } from '@/lib/utils'

export type StatSubCountTone = 'success' | 'warning' | 'danger' | 'accent' | 'muted'

export interface StatSubCount {
  label: string
  value: ReactNode
  tone?: StatSubCountTone
}

const SUBCOUNT_TONE_CLASS: Record<StatSubCountTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  accent: 'text-accent',
  muted: 'text-muted-foreground',
}

export interface StatProps {
  label: string
  value: ReactNode
  hint?: string
  // A small secondary breakdown line under the main figure, e.g.
  // "Pending 3  Issues 1" - optional, purely additive to the tile.
  subCounts?: StatSubCount[]
  className?: string
}

/**
 * A KPI tile: an uppercase micro-label over a large tabular figure, with an
 * optional row of small labeled sub-counts underneath. Used across the
 * Admin, Project Lead and Operator dashboards.
 */
export function Stat({ label, value, hint, subCounts, className }: StatProps): JSX.Element {
  return (
    <div className={cn('border-border bg-surface rounded-lg border p-4 shadow-xs', className)}>
      <p className="text-subtle-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      <p className="text-foreground mt-2 font-mono text-2xl font-medium tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
      {subCounts && subCounts.length > 0 ? (
        <div className="border-border mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2">
          {subCounts.map(subCount => (
            <span key={subCount.label} className="text-xs">
              <span className="text-muted-foreground">{subCount.label} </span>
              <span
                className={cn(
                  'font-mono font-medium tabular-nums',
                  SUBCOUNT_TONE_CLASS[subCount.tone ?? 'muted'],
                )}
              >
                {subCount.value}
              </span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
