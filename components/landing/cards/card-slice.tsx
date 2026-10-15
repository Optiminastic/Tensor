import type { JSX } from 'react'

import { CardLabel } from './card-label'
import { CarouselCard } from './carousel-card'

/** Layer-by-layer time, as bar heights. */
const BARS = ['h-6', 'h-10', 'h-7', 'h-12', 'h-9', 'h-11', 'h-14']

/** What the slicer measured: the numbers costing starts from. */
export function CardSlice(): JSX.Element {
  return (
    <CarouselCard>
      <CardLabel>Slicer metrics</CardLabel>
      <p className="text-2xl font-medium tracking-tight tabular-nums">2h 14m</p>
      <p className="text-landing-ink/70 text-xs">print time, from the slicer</p>
      <div className="mt-auto flex h-16 items-end gap-1">
        {BARS.map((height, i) => (
          <span key={i} className={`bg-landing-sky flex-1 rounded-sm ${height}`} />
        ))}
      </div>
      <p className="text-landing-ink/70 font-mono text-[0.625rem] tabular-nums">
        38.6 g PLA · 4.2 g purge
      </p>
    </CarouselCard>
  )
}
