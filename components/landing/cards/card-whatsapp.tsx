import type { JSX } from 'react'

import { CardLabel } from './card-label'
import { CarouselCard } from './carousel-card'

/** The customer asking, and the shop answering, on WhatsApp. */
export function CardWhatsApp(): JSX.Element {
  return (
    <CarouselCard className="bg-landing-paper">
      <CardLabel>WhatsApp</CardLabel>
      <p className="self-end rounded-xl rounded-br-sm bg-white px-2.5 py-1.5 text-xs shadow-sm">
        Where is my order?
      </p>
      <p className="bg-landing-lime self-start rounded-xl rounded-bl-sm px-2.5 py-1.5 text-xs">
        Dispatched! Delhivery, arriving tomorrow 📦
      </p>
      <p className="text-landing-ink/70 mt-auto font-mono text-[0.625rem]">Answered in 3 s</p>
    </CarouselCard>
  )
}
