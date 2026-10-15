import Image from 'next/image'
import type { JSX } from 'react'

/** The product on a blue card, with the number Tensor attached to it. */
export function BentoPhotoCard(): JSX.Element {
  return (
    <article className="bg-landing-sky relative flex min-h-80 flex-col justify-end overflow-hidden rounded-3xl p-3 sm:row-span-2">
      <Image
        src="/landing/products/luminous-name.png"
        alt="A personalised 3D printed name in blue and silver, on a wall"
        fill
        sizes="(min-width: 1024px) 33vw, 100vw"
        className="object-cover object-right"
      />
      <div className="relative rounded-2xl bg-white p-5">
        <p className="text-landing-ink text-5xl font-medium tracking-[-0.04em] tabular-nums">
          ₹219.95
        </p>
        <p className="text-landing-ink/75 mt-3 text-sm text-pretty">
          Design CP for one name piece: filament, machine time, finishing and a failure provision,
          straight from the slicer.
        </p>
      </div>
    </article>
  )
}
