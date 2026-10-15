import { headers } from 'next/headers'
import type { JSX, ReactNode } from 'react'

import { interTight } from '@/components/landing/landing-font'
import { SiteFooter } from '@/components/landing/site-footer'
import { SiteHeader, type SitePage } from '@/components/landing/site-header'
import { SkyBackdrop } from '@/components/landing/sky-backdrop'
import { getSessionSafe } from '@/lib/auth'

interface MarketingPageProps {
  page: SitePage
  eyebrow: string
  title: string
  intro: string
  children: ReactNode
}

/**
 * The shell every public page after the homepage shares: a short sky band
 * holding the nav, the page's title and one paragraph, then the content and
 * the ink footer - the homepage's look, without its full hero.
 */
export async function MarketingPage(props: MarketingPageProps): Promise<JSX.Element> {
  const { page, eyebrow, title, intro, children } = props
  // A failed lookup means "signed out": a public page must never 500 over auth.
  const signedIn = Boolean(await getSessionSafe(await headers()))
  return (
    <div
      className={`${interTight.variable} font-landing text-foreground bg-background flex min-h-screen flex-col`}
    >
      <section className="p-2 sm:p-3">
        <div className="relative isolate overflow-hidden rounded-[1.75rem]">
          <SkyBackdrop variant="deep" />
          <SiteHeader signedIn={signedIn} current={page} />
          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-5 px-5 pt-10 pb-16 text-center text-white sm:pt-14 sm:pb-20">
            <p className="font-mono text-xs tracking-[0.2em] uppercase">
              <span aria-hidden className="mr-2">
                •
              </span>
              {eyebrow}
            </p>
            <h1 className="text-4xl leading-[1.04] font-medium tracking-[-0.045em] text-balance sm:text-6xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base text-pretty text-white/90 sm:text-lg">{intro}</p>
          </div>
        </div>
      </section>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
