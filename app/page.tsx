import type { JSX } from 'react'

import { Capabilities } from '@/components/landing/capabilities'
import { Hero } from '@/components/landing/hero'
import { HeroVisual } from '@/components/landing/hero-visual'
import { Pipeline } from '@/components/landing/pipeline'
import { ProductCallout } from '@/components/landing/product-callout'
import { RolesStrip } from '@/components/landing/roles-strip'
import { SiteFooter } from '@/components/landing/site-footer'
import { SiteHeader } from '@/components/landing/site-header'

export default function LandingPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <HeroVisual />
        <RolesStrip />
        <ProductCallout />
        <Pipeline />
        <Capabilities />
      </main>
      <SiteFooter />
    </div>
  )
}
