import type { JSX } from 'react'

import type { FigureRow } from '@/components/landing/pipeline-figure'
import { cn } from '@/lib/utils'

export interface PipelineStep {
  id: string
  n: string
  label: string
  body: string
  caption: string
  rows: FigureRow[]
}

export interface PipelineStepItemProps {
  step: PipelineStep
  active: boolean
  onSelect: () => void
}

/**
 * One rung of the pipeline: a disclosure whose trigger also drives the figure
 * beside it. `aria-controls` names both regions, because the click genuinely
 * changes both — pointing it at the prose alone would under-report the effect.
 *
 * Collapsed bodies use `hidden` rather than height animation: the step numbers
 * must stay scannable, and a measured list does not need to perform.
 */
export function PipelineStepItem({ step, active, onSelect }: PipelineStepItemProps): JSX.Element {
  return (
    <li className={cn('border-border border-b', active && 'bg-surface')}>
      <h3>
        <button
          type="button"
          id={`${step.id}-trigger`}
          aria-expanded={active}
          aria-controls={`${step.id}-body pipeline-readout`}
          onClick={onSelect}
          className="group flex w-full items-center gap-3 px-5 py-4 text-left transition-colors"
        >
          <span
            className={cn(
              'font-mono text-xs tabular-nums transition-colors',
              active ? 'text-accent' : 'text-subtle-foreground',
            )}
          >
            {step.n}
          </span>
          <span
            className={cn(
              'text-sm font-semibold tracking-tight transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
            )}
          >
            {step.label}
          </span>
        </button>
      </h3>

      <div
        id={`${step.id}-body`}
        role="region"
        aria-labelledby={`${step.id}-trigger`}
        hidden={!active}
      >
        <p className="text-muted-foreground max-w-md px-5 pt-0 pb-5 pl-11 text-xs leading-relaxed text-pretty">
          {step.body}
        </p>
      </div>
    </li>
  )
}
