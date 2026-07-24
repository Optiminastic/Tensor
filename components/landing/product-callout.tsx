import Link from 'next/link'
import type { JSX } from 'react'

import { Eyebrow } from '@/components/landing/eyebrow'
import { Frame } from '@/components/landing/frame'
import { Logo } from '@/components/logo'
import { buttonVariants } from '@/components/ui/button'

/**
 * The centred statement of intent, on a full-bleed muted ground.
 *
 * Deliberately *not* `.text-display`: the hero owns the page's one display
 * moment, so this reaches for size and weight in the interface face instead.
 * Reaching for the display face a second time would flatten the hierarchy
 * rather than reinforce it.
 */
export function ProductCallout(): JSX.Element {
  return (
    <section id="product" className="border-border bg-surface-muted scroll-mt-16 border-t">
      <Frame marked className="px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <Eyebrow>Product</Eyebrow>

          <h2 className="text-foreground text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            <Logo
              showWordmark={false}
              markClassName="h-6 sm:h-7"
              className="-mt-1 mr-2 inline-flex align-middle"
            />
            Tensor. So margin is decided, not discovered.
          </h2>

          <p className="text-muted-foreground max-w-md text-sm leading-relaxed text-pretty">
            The engine costs a design from its slicer metrics and prices it off an approved ladder.
            Pure unit economics — the same answer every time, for every reviewer.
          </p>

          <Link href="/login" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
            Start costing a design
          </Link>
        </div>
      </Frame>
    </section>
  )
}
