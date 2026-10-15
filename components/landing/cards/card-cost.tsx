import type { JSX } from 'react'

import { CardLabel } from './card-label'
import { CarouselCard } from './carousel-card'

const ROWS = [
  { label: 'Filament', value: '₹45.00' },
  { label: 'Machine', value: '₹112.50' },
  { label: 'Finishing', value: '₹30.00' },
]

/** The Design CP panel: cost price built up from slicer-true parts. */
export function CardCost(): JSX.Element {
  return (
    <CarouselCard>
      <div className="flex items-center justify-between">
        <CardLabel>Design CP</CardLabel>
        <span className="bg-landing-lime rounded-full px-1.5 py-0.5 font-mono text-[0.5625rem] uppercase">
          Green
        </span>
      </div>
      <p className="text-2xl font-medium tracking-tight tabular-nums">₹219.95</p>
      <ul className="mt-auto flex flex-col gap-1.5">
        {ROWS.map(r => (
          <li
            key={r.label}
            className="border-landing-ink/10 flex justify-between border-b pb-1 text-xs"
          >
            <span className="text-landing-ink/70">{r.label}</span>
            <span className="font-mono tabular-nums">{r.value}</span>
          </li>
        ))}
      </ul>
    </CarouselCard>
  )
}
