import Image from 'next/image'
import type { JSX } from 'react'

import { CarouselCard } from './carousel-card'

/** The product itself - the reason all the numbers exist. */
export function CardPhoto(): JSX.Element {
  return (
    <CarouselCard className="relative h-60 w-52 p-0">
      <Image
        src="/landing/products/date-plank.png"
        alt="A personalised 3D printed name plank in yellow, red and blue"
        fill
        sizes="208px"
        className="object-cover"
        priority
      />
      <div className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between rounded-xl bg-white/90 px-3 py-2 backdrop-blur">
        <span className="text-xs font-medium">Dual name plank</span>
        <span className="font-mono text-xs tabular-nums">₹699</span>
      </div>
    </CarouselCard>
  )
}
