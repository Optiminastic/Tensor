import type { Metadata } from 'next'
import Link from 'next/link'
import type { JSX } from 'react'

import { Logo } from '@/components/logo'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Page not found' }

/**
 * The app-wide 404. Rendered by Next for any unmatched route. Styled in the
 * Editorial Ink language: the display face for the headline, a mono figure for
 * the code, and design-system buttons - no generic "AI 404".
 */
export default function NotFound(): JSX.Element {
  return (
    <main className="bg-background flex min-h-dvh flex-col px-6 py-8">
      <header>
        <Link href="/" aria-label="Tensor home" className="inline-flex">
          <Logo />
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-subtle-foreground font-mono text-xs tracking-[0.2em] uppercase">
            Error 404
          </span>
          <p
            aria-hidden
            className="text-muted-foreground font-mono text-7xl leading-none font-semibold tabular-nums sm:text-8xl"
          >
            404
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <h1 className="text-display text-3xl sm:text-4xl">This page doesn&apos;t exist</h1>
          <p className="text-muted-foreground max-w-md text-sm text-pretty">
            The page you&apos;re looking for was moved, renamed, or never existed. Check the address
            or head back to your dashboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard" className={buttonVariants()}>
            Back to dashboard
          </Link>
          <Link href="/" className={buttonVariants({ variant: 'secondary' })}>
            Go home
          </Link>
        </div>
      </div>
    </main>
  )
}
