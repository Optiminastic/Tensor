import type { JSX } from 'react'

import { About } from '@/components/landing/about'
import { Hero } from '@/components/landing/hero'
import { InsideTensor } from '@/components/landing/inside-tensor'
import { interTight } from '@/components/landing/landing-font'
import { SiteFooter } from '@/components/landing/site-footer'
import { WorksWithMarquee } from '@/components/landing/works-with-marquee'

export default function LandingPage(): JSX.Element {
  return (
    <div
      className={`${interTight.variable} font-landing text-foreground bg-background flex min-h-screen flex-col`}
    >
      <main className="flex-1">
        <Hero />
        <WorksWithMarquee />
        <About />
        <InsideTensor />
      </main>
      <SiteFooter />
    </div>
  )
}
