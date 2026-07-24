import type { JSX } from 'react'

import { Eyebrow } from '@/components/landing/eyebrow'
import { Frame } from '@/components/landing/frame'

/** Each one is a rule the engine already enforces, not a roadmap item. */
const CAPABILITIES = [
  {
    title: 'Slicer-true metrics',
    body: 'Print time, filament, purge and support come from the slicer itself. Nothing in the Design CP is an estimate.',
  },
  {
    title: 'Batch-aware machine time',
    body: 'Effective machine time is per unit, after batching units onto one bed — so a full plate is not costed like a single print.',
  },
  {
    title: 'Approved ladders',
    body: 'Prices snap up to a rung the team already signed off, per brand. Nobody invents a number at the point of sale.',
  },
  {
    title: 'Stress-tested margin',
    body: 'Every price is re-run at 40% ad spend before approval, so a rung that only works organically is caught early.',
  },
]

export function Capabilities(): JSX.Element {
  return (
    <section id="capabilities" className="border-border scroll-mt-16 border-t">
      <Frame marked className="px-6 py-16 sm:px-10 sm:py-20">
        <div className="grid gap-x-10 gap-y-6 md:grid-cols-12">
          <div className="flex flex-col gap-4 md:col-span-7">
            <Eyebrow>Capabilities</Eyebrow>
            <h2 className="text-foreground max-w-md text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Everything the costing call needs. Nothing it doesn&rsquo;t.
            </h2>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty md:col-span-5 md:pt-10">
            The engine is pure: the same inputs give the same answer to a Designer, a Project Lead
            and an auditor six months from now. That is the whole point of taking the maths out of
            the conversation.
          </p>
        </div>

        <dl className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {CAPABILITIES.map(item => (
            <div key={item.title} className="border-border flex flex-col gap-1.5 border-t pt-4">
              <dt className="text-foreground text-sm font-semibold tracking-tight">{item.title}</dt>
              <dd className="text-muted-foreground text-xs leading-relaxed text-pretty">
                {item.body}
              </dd>
            </div>
          ))}
        </dl>
      </Frame>
    </section>
  )
}
