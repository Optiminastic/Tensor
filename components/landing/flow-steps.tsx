import {
  Boxes,
  CheckCheck,
  Cuboid,
  FileStack,
  Printer,
  ShoppingBag,
  Truck,
  UserCheck,
} from 'lucide-react'
import type { JSX } from 'react'

import type { FlowStep } from '@/components/landing/content/architecture'

/** Each step's picture, in the order ORDER_FLOW lists them. */
const STEP_ICONS = [ShoppingBag, FileStack, UserCheck, Cuboid, Boxes, Printer, CheckCheck, Truck]

interface FlowStepsProps {
  steps: readonly FlowStep[]
}

/**
 * The pipeline as a timeline: one rail, a print head travelling down it, and
 * each step numbered in the order work moves through it.
 */
export function FlowSteps({ steps }: FlowStepsProps): JSX.Element {
  return (
    <div className="relative">
      <div aria-hidden className="bg-landing-ink/10 absolute top-4 bottom-4 left-[1.1rem] w-0.5">
        <span className="animate-landing-descend bg-landing-sky absolute left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_6px_rgb(45_138_247/0.18)]" />
      </div>
      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const Icon = STEP_ICONS[i % STEP_ICONS.length]
          return (
            <li key={step.title} className="relative flex gap-6">
              <span className="bg-landing-lime text-landing-ink ring-landing-paper relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-sm tabular-nums ring-4">
                {i + 1}
              </span>
              <div className="bg-landing-paper flex flex-1 flex-col gap-1 rounded-[1.5rem] px-6 py-5 md:flex-row md:items-center md:gap-8">
                <h3 className="flex items-center gap-3 text-lg font-medium tracking-[-0.02em] md:w-60 md:shrink-0">
                  <span className="text-landing-sky flex size-9 shrink-0 items-center justify-center rounded-xl bg-white">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  {step.title}
                </h3>
                <p className="text-landing-ink/70 flex-1 text-sm text-pretty">{step.detail}</p>
                <p className="text-landing-ink/60 text-xs font-medium md:w-40 md:text-right">
                  {step.by}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
