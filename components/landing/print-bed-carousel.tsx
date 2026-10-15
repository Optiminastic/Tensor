import type { JSX, ReactNode } from 'react'

import { CardConfirm } from '@/components/landing/cards/card-confirm'
import { CardCost } from '@/components/landing/cards/card-cost'
import { CardFleet } from '@/components/landing/cards/card-fleet'
import { CardOrder } from '@/components/landing/cards/card-order'
import { CardPhoto } from '@/components/landing/cards/card-photo'
import { CardPlate } from '@/components/landing/cards/card-plate'
import { CardShipping } from '@/components/landing/cards/card-shipping'
import { CardSlice } from '@/components/landing/cards/card-slice'
import { CardWhatsApp } from '@/components/landing/cards/card-whatsapp'

interface Slot {
  card: ReactNode
  /** Where the card stands on the arc: tilt, drop and size grow with distance from the centre. */
  pose: string
}

/**
 * Tensor's screens standing on a curved print bed, in the order an order lives
 * them: sliced, costed, packed, printed, confirmed, shipped, answered. The
 * outer cards drop away as the screen narrows; on a phone the centre card
 * stands between the edges of its two neighbours.
 */
const SLOTS: Slot[] = [
  { card: <CardSlice />, pose: 'hidden 2xl:block rotate-y-50 translate-y-20 scale-75' },
  { card: <CardCost />, pose: 'hidden xl:block rotate-y-36 translate-y-11 scale-[0.83]' },
  { card: <CardPlate />, pose: 'hidden lg:block rotate-y-24 translate-y-5 scale-90' },
  { card: <CardFleet />, pose: 'rotate-y-12 translate-y-1 scale-95' },
  { card: <CardPhoto />, pose: 'z-10' },
  { card: <CardConfirm />, pose: '-rotate-y-12 translate-y-1 scale-95' },
  { card: <CardOrder />, pose: 'hidden lg:block -rotate-y-24 translate-y-5 scale-90' },
  { card: <CardShipping />, pose: 'hidden xl:block -rotate-y-36 translate-y-11 scale-[0.83]' },
  { card: <CardWhatsApp />, pose: 'hidden 2xl:block -rotate-y-50 translate-y-20 scale-75' },
]

export function PrintBedCarousel(): JSX.Element {
  return (
    <div
      aria-label="What Tensor tracks for every print"
      role="img"
      className="flex items-center justify-center gap-1 perspective-distant transform-3d sm:gap-2"
    >
      {SLOTS.map((slot, i) => (
        <div key={i} className={`shrink-0 transition-transform duration-500 ${slot.pose}`}>
          {slot.card}
        </div>
      ))}
    </div>
  )
}
