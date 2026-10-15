import { headers } from 'next/headers'
import type { JSX } from 'react'

import { LayerMark } from '@/components/landing/layer-mark'
import { PillLink } from '@/components/landing/pill-link'
import { PrintBedCarousel } from '@/components/landing/print-bed-carousel'
import { SiteHeader } from '@/components/landing/site-header'
import { SkyBackdrop } from '@/components/landing/sky-backdrop'
import { getSessionSafe } from '@/lib/auth'

/**
 * The sky card: nav, the two-tone headline, the two pill actions, and Tensor's
 * screens standing on a curved print bed.
 */
export async function Hero(): Promise<JSX.Element> {
  // A failed lookup means "signed out": the homepage must never 500 over auth.
  const signedIn = Boolean(await getSessionSafe(await headers()))
  const start = signedIn ? '/dashboard' : '/login'
  return (
    <section id="product" className="p-2 sm:p-3">
      <div className="relative isolate overflow-hidden rounded-[1.75rem]">
        <SkyBackdrop />
        <SiteHeader signedIn={signedIn} />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-5 pt-10 text-center sm:pt-16">
          <h1 className="text-[2.6rem] leading-[1.02] font-medium tracking-[-0.045em] text-balance text-white sm:text-6xl lg:text-7xl">
            From design file to doorstep,
            <span className="block text-white/70">every print accounted for</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-pretty text-white/90 sm:text-lg">
            Tensor costs every design from the slicer, packs the beds, runs the printers and follows
            each order to the customer&apos;s door.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <PillLink href="/product" tone="glass">
              View pipeline
            </PillLink>
            <PillLink href={start} tone="lime" withArrow>
              Get started
            </PillLink>
          </div>
        </div>

        <div className="relative z-10 mt-14 px-4 sm:mt-16">
          <PrintBedCarousel />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-2 pt-10 pb-10 text-center">
          <p className="text-landing-ink/80 text-sm">Costed from the slicer, never estimated.</p>
          <LayerMark />
        </div>
      </div>
    </section>
  )
}
