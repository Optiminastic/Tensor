import type { JSX } from 'react'

import { DataValue } from '@/components/ui/data-value'
import { cn } from '@/lib/utils'

export type FigureTone = 'default' | 'accent' | 'success' | 'warning'

export interface FigureRow {
  label: string
  value: string
  tone?: FigureTone
  /** Render the row as the stage's conclusion rather than one of its inputs. */
  total?: boolean
}

export interface PipelineFigureProps {
  caption: string
  rows: FigureRow[]
  className?: string
}

const TONE_CLASS: Record<FigureTone, string> = {
  default: 'text-foreground',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
}

/**
 * One readout, five stages. Every stage of the pipeline resolves to the same
 * shape — labelled rows ending in a conclusion — so the figure is data-driven
 * rather than five near-identical components drifting apart.
 *
 * Tone never carries meaning alone: the value always says what the colour says.
 */
export function PipelineFigure({ caption, rows, className }: PipelineFigureProps): JSX.Element {
  return (
    <figure className={cn('border-border bg-surface rounded-md border shadow-xs', className)}>
      <figcaption className="border-border text-subtle-foreground border-b px-4 py-2.5 font-mono text-xs tracking-widest uppercase">
        {caption}
      </figcaption>
      <dl className="px-4 py-1">
        {rows.map(row => (
          <div
            key={row.label}
            className={cn(
              'border-border/70 flex items-center justify-between gap-4 border-b py-2.5 last:border-b-0',
              row.total && 'border-border mt-1 border-t border-b-0 pt-3',
            )}
          >
            <dt
              className={cn(
                'text-xs',
                row.total ? 'text-foreground font-semibold' : 'text-muted-foreground',
              )}
            >
              {row.label}
            </dt>
            <dd>
              <DataValue
                value={row.value}
                className={cn(
                  row.total ? 'text-sm font-medium' : 'text-xs',
                  TONE_CLASS[row.tone ?? 'default'],
                )}
              />
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  )
}
