import type { JSX } from 'react'

import { CardLabel } from './card-label'
import { CarouselCard } from './carousel-card'

/** Parts packed on one bed, as the planner lays them out. */
const PARTS = ['col-span-4', 'col-span-2', 'col-span-3', 'col-span-3', 'col-span-6']

export function CardPlate(): JSX.Element {
  return (
    <CarouselCard tone="sky">
      <CardLabel>Bed 07 · PLA white</CardLabel>
      <div className="grid flex-1 grid-cols-6 gap-1.5 rounded-lg bg-white/15 p-2">
        {PARTS.map((span, i) => (
          <span key={i} className={`${span} bg-landing-lime/90 rounded-md`} />
        ))}
      </div>
      <p className="font-mono text-[0.625rem] tracking-wide tabular-nums">
        5 / 5 placed · 91% used
      </p>
    </CarouselCard>
  )
}
