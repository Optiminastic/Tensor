import { Calculator, Printer } from 'lucide-react'
import type { JSX } from 'react'

import { Bento } from '@/components/landing/bento'
import { InlineIconPill } from '@/components/landing/inline-icon-pill'

/** "About Tensor": the one-sentence pitch, then the facts behind it. */
export function About(): JSX.Element {
  return (
    <section id="about" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <p className="text-landing-ink text-center font-mono text-xs tracking-[0.2em] uppercase">
        <span aria-hidden className="mr-2">
          •
        </span>
        About Tensor
      </p>
      <h2 className="text-landing-ink mx-auto mt-6 max-w-4xl text-center text-4xl leading-[1.08] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">
        One system for slicer-true
        <InlineIconPill icon={Calculator} tone="sky" />
        costing,
        <InlineIconPill icon={Printer} tone="lime" />
        printer-ready production
        <span className="text-landing-muted"> and orders that arrive on time</span>
      </h2>
      <Bento />
    </section>
  )
}
