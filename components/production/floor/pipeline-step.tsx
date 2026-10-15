import type { JSX } from 'react'

import type { PipelineStage } from '@/lib/production/pipeline'
import { cn } from '@/lib/utils'

interface PipelineStepProps {
  stage: PipelineStage
  index: number
  busiest: boolean
}

/** One stage of the flow: its step number, its count, its name. */
export function PipelineStep({ stage, index, busiest }: PipelineStepProps): JSX.Element {
  const packed = stage.key === 'packed'
  return (
    <li
      className={cn(
        'flex min-h-32 flex-col justify-between gap-3 rounded-2xl p-4',
        busiest
          ? 'bg-landing-lime text-landing-ink'
          : 'bg-white/10 ring-1 ring-white/20 backdrop-blur-md',
      )}
    >
      <div className="flex items-center justify-between gap-2 font-mono text-xs tabular-nums">
        <span>{String(index + 1).padStart(2, '0')}</span>
        {busiest ? <span className="tracking-wide uppercase">Busiest</span> : null}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-4xl font-medium tracking-[-0.04em] tabular-nums">{stage.count}</span>
        <span className="text-sm">{stage.label}</span>
      </div>
    </li>
  )
}
