import type { JSX } from 'react'

import { CardLabel } from './card-label'
import { CarouselCard } from './carousel-card'

/** One printer of the fleet, live. */
export function CardFleet(): JSX.Element {
  return (
    <CarouselCard tone="ink">
      <CardLabel>Printer fleet</CardLabel>
      <p className="text-sm leading-snug">
        Bambu H2C <span className="text-landing-lime">● printing</span>
      </p>
      <p className="mt-auto text-3xl font-medium tracking-tight tabular-nums">64%</p>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
        <span className="bg-landing-lime block h-full w-[64%] rounded-full" />
      </div>
      <p className="font-mono text-[0.625rem] text-white/70 tabular-nums">1h 12m left · bed 07</p>
    </CarouselCard>
  )
}
