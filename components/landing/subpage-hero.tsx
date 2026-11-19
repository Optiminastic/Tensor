import { headers } from 'next/headers'
import type { JSX } from 'react'

import { SiteHeader } from '@/components/landing/site-header'
import { SkyBackdrop } from '@/components/landing/sky-backdrop'
import { getSessionSafe } from '@/lib/auth'

interface SubpageHeroProps {
  /** The mono label above the title, e.g. "Integrations". */
  eyebrow: string
  title: string
  /** One or two sentences under the title. */
  intro: string
}

/**
 * The sky card at the top of every marketing page: the same nav and backdrop as
 * the homepage hero, with the page's own title in place of the headline - so
 * moving between Features, About, Integrations and Architecture reads as one
 * site, not five.
 */
export async function SubpageHero({
  eyebrow,
  title,
  intro,
}: SubpageHeroProps): Promise<JSX.Element> {
  // A failed lookup means "signed out": a marketing page must never 500 over auth.
  const signedIn = Boolean(await getSessionSafe(await headers()))
  return (
    <section className="p-2 sm:p-3">
      <div className="relative isolate overflow-hidden rounded-[1.75rem]">
        <SkyBackdrop />
        <SiteHeader signedIn={signedIn} />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 pt-10 pb-16 text-center sm:pt-14 sm:pb-20">
          <p className="font-mono text-xs tracking-[0.18em] text-white/85 uppercase">
            <span aria-hidden className="mr-2">
              •
            </span>
            {eyebrow}
          </p>
          <h1 className="mt-4 text-[2.4rem] leading-[1.04] font-medium tracking-[-0.045em] text-balance text-white sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base text-pretty text-white/90 sm:text-lg">{intro}</p>
        </div>
      </div>
    </section>
  )
}
