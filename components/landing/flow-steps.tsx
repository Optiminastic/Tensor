import type { JSX } from 'react'

import type { FlowStep } from '@/components/landing/content/architecture'

interface FlowStepsProps {
  steps: readonly FlowStep[]
}

/**
 * A pipeline as numbered steps, in the order work moves through it: the number
 * on a lime disc, what happens, and the part of the system that does it.
 */
export function FlowSteps({ steps }: FlowStepsProps): JSX.Element {
  return (
    <ol className="grid gap-4 md:grid-cols-2">
      {steps.map((step, i) => (
        <li key={step.title} className="bg-landing-paper flex gap-4 rounded-[1.5rem] p-6">
          <span className="bg-landing-lime text-landing-ink flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-sm tabular-nums">
            {i + 1}
          </span>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-medium tracking-[-0.02em]">{step.title}</h3>
            <p className="text-landing-ink/70 text-sm text-pretty">{step.detail}</p>
            <p className="text-landing-ink/60 font-mono text-[0.7rem] tracking-[0.16em] uppercase">
              {step.by}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
