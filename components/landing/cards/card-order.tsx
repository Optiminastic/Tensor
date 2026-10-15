import type { JSX } from 'react'

import { CardLabel } from './card-label'
import { CarouselCard } from './carousel-card'

const STEPS = [
  { label: 'Paid', done: true },
  { label: 'Confirmed', done: true },
  { label: 'Printing', done: true },
  { label: 'Packed', done: false },
]

/** An order walking through production. */
export function CardOrder(): JSX.Element {
  return (
    <CarouselCard>
      <CardLabel>Order</CardLabel>
      <p className="font-mono text-sm tabular-nums">T3DPS-115766</p>
      <ol className="mt-auto flex flex-col gap-2">
        {STEPS.map(step => (
          <li key={step.label} className="flex items-center gap-2 text-xs">
            <span
              className={
                step.done
                  ? 'bg-landing-sky size-2.5 rounded-full'
                  : 'border-landing-ink/30 size-2.5 rounded-full border'
              }
            />
            <span className={step.done ? '' : 'text-landing-ink/70'}>{step.label}</span>
          </li>
        ))}
      </ol>
    </CarouselCard>
  )
}
