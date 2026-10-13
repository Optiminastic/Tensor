import { Truck } from 'lucide-react'
import type { JSX } from 'react'

import { CardLabel } from './card-label'
import { CarouselCard } from './carousel-card'

/** The parcel after it leaves the workshop. */
export function CardShipping(): JSX.Element {
  return (
    <CarouselCard>
      <CardLabel>Delivery</CardLabel>
      <span className="bg-landing-paper grid size-9 place-items-center rounded-xl">
        <Truck className="size-4" aria-hidden />
      </span>
      <p className="text-sm font-medium">Out for delivery</p>
      <p className="text-landing-ink/70 text-xs">Courier scan, 9:42 am</p>
      <p className="mt-auto font-mono text-[0.625rem] tabular-nums">AWB 5990 6610 0244</p>
    </CarouselCard>
  )
}
