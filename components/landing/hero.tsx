import Link from 'next/link'
import type { JSX } from 'react'

import { Frame } from '@/components/landing/frame'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'

/**
 * The one display moment on the page. The headline carries `.text-display`; no
 * other heading may, so the hierarchy stays legible from across the room. Copy
 * and actions sit right of the headline rather than under it, which keeps the
 * measure short enough to read and the fold high enough to see the figure.
 */
export function Hero(): JSX.Element {
  return (
    <Frame marked className="px-6 pt-12 pb-14 sm:px-10 sm:pt-16 sm:pb-20">
      <div className="grid gap-x-10 gap-y-8 md:grid-cols-12">
        <div className="flex flex-col items-start gap-5 md:col-span-7">
          <Badge tone="accent">Internal · costing &amp; pricing</Badge>
          <h1 className="text-display text-foreground text-4xl text-balance sm:text-5xl lg:text-6xl">
            Slicer-true costing and margin-safe pricing for 3D printed goods.
          </h1>
        </div>

        <div className="flex flex-col items-start gap-5 md:col-span-5 md:pt-11">
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed text-pretty">
            Tensor turns a design file into a true Design CP, flags what will cost you before it
            ships, and prices it off the approved ladder — so margin is decided, not discovered.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/login" className={buttonVariants({ variant: 'primary' })}>
              Sign in
            </Link>
            <Link href="/style-guide" className={buttonVariants({ variant: 'secondary' })}>
              Design system
            </Link>
          </div>
        </div>
      </div>
    </Frame>
  )
}
