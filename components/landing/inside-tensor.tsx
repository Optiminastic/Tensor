import type { JSX } from 'react'

import { AreaCard } from '@/components/landing/marketing/area-card'
import { PillLink } from '@/components/landing/pill-link'
import { AREAS } from '@/lib/marketing/areas'

/**
 * "Inside Tensor": every area of the dashboard, what it is for and the pages
 * in it - so a visitor knows what each screen does before signing in. Each
 * card opens its section on the Product page.
 */
export function InsideTensor(): JSX.Element {
  return (
    <section id="inside" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="font-mono text-xs tracking-[0.2em] uppercase">
          <span aria-hidden className="mr-2">
            •
          </span>
          Inside Tensor
        </p>
        <h2 className="max-w-3xl text-4xl leading-[1.08] font-medium tracking-[-0.04em] text-balance sm:text-5xl">
          Seven areas, one for each part of the job
          <span className="text-landing-muted"> - and what every page in them does</span>
        </h2>
      </div>
      <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map((area, index) => (
          <AreaCard key={area.key} area={area} index={index} />
        ))}
        <div className="bg-landing-lime flex flex-col justify-between gap-6 rounded-3xl p-6">
          <p className="text-2xl font-medium tracking-[-0.03em] text-balance">
            See every page, and how a design travels from upload to the customer&apos;s door.
          </p>
          <PillLink href="/product" tone="ink" withArrow className="self-start">
            The whole product
          </PillLink>
        </div>
      </div>
    </section>
  )
}
