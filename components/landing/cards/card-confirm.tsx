import { Check } from 'lucide-react'
import type { JSX } from 'react'

import { CardLabel } from './card-label'
import { CarouselCard } from './carousel-card'

/** The names a customer confirmed before anything was printed. */
export function CardConfirm(): JSX.Element {
  return (
    <CarouselCard tone="sky">
      <CardLabel>Personalisation</CardLabel>
      <p className="text-landing-lime font-mono text-lg leading-tight">RAHUL ♥ PRIYA</p>
      <p className="text-xs text-white/85">2 red hearts · blue</p>
      <p className="mt-auto flex items-center gap-1.5 text-xs">
        <span className="bg-landing-lime text-landing-ink grid size-4 place-items-center rounded-full">
          <Check className="size-3" aria-hidden />
        </span>
        Confirmed by customer
      </p>
    </CarouselCard>
  )
}
