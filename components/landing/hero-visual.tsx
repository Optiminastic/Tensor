import type { JSX } from 'react'

import { CostPanel } from '@/components/landing/cost-panel'
import { Frame } from '@/components/landing/frame'
import { HeroFigure } from '@/components/landing/hero-figure'
import { Logo } from '@/components/logo'

/**
 * The product in one line: a raw design comes out as a defensible number.
 *
 * The ground stops at the column rather than running full-bleed, so the figure
 * reads as an exhibit pinned to the grid rather than as another band. The mark
 * sits on the seam where the drawing turns into a cost.
 */
export function HeroVisual(): JSX.Element {
  return (
    <section aria-label="How a design file becomes a cost" className="border-border border-t">
      <Frame marked className="bg-surface-muted px-6 py-10 sm:px-10 sm:py-12">
        <div className="grid items-center gap-8 md:grid-cols-12">
          <div className="flex justify-center md:col-span-4">
            <HeroFigure className="w-40 sm:w-48" />
          </div>

          <div className="flex items-center justify-center md:col-span-2" aria-hidden>
            <span className="border-border bg-surface flex size-14 items-center justify-center rounded-full border shadow-xs">
              <Logo showWordmark={false} />
            </span>
          </div>

          <div className="md:col-span-6">
            <CostPanel />
          </div>
        </div>
      </Frame>
    </section>
  )
}
