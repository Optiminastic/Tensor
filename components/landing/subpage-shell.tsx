import type { JSX, ReactNode } from 'react'

import { interTight } from '@/components/landing/landing-font'
import { SiteFooter } from '@/components/landing/site-footer'
import { SubpageHero } from '@/components/landing/subpage-hero'

interface SubpageShellProps {
  eyebrow: string
  title: string
  intro: string
  children: ReactNode
}

/**
 * A marketing page in the homepage's landing UI: Inter Tight on white, the sky
 * hero with the shared nav, the page's sections, and the ink footer.
 */
export function SubpageShell({ eyebrow, title, intro, children }: SubpageShellProps): JSX.Element {
  return (
    <div
      className={`${interTight.variable} font-landing text-landing-ink flex min-h-screen flex-col bg-white`}
    >
      <SubpageHero eyebrow={eyebrow} title={title} intro={intro} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-5 py-16 sm:px-8 sm:py-20">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
