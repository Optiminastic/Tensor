import Link from 'next/link'
import type { JSX } from 'react'

import { PillLink } from '@/components/landing/pill-link'
import { type SitePage, SiteNavLinks } from '@/components/landing/site-nav-links'
import { Logo } from '@/components/logo'

export type { SitePage }

interface SiteHeaderProps {
  signedIn: boolean
  /** The page being shown, marked in the nav with aria-current. */
  current?: SitePage
}

/**
 * The nav that sits on the sky: mono and uppercase, each link its own page.
 * On a phone the links drop to a row under the mark rather than vanishing.
 *
 * The action is session-aware: a signed-in visitor gets "Dashboard" rather
 * than "Sign in", which would bounce them straight back here. UX only - every
 * real check happens in Tensor-Core.
 */
export function SiteHeader({ signedIn, current }: SiteHeaderProps): JSX.Element {
  const action = signedIn
    ? { href: '/dashboard', label: 'Dashboard' }
    : { href: '/login', label: 'Sign in' }

  return (
    <header className="relative z-10 flex flex-col gap-4 px-5 py-5 sm:px-8">
      <div className="flex items-center justify-between gap-6">
        <Link href="/" aria-label="Tensor - home" className="rounded-sm text-white">
          <Logo className="text-white" />
        </Link>
        <SiteNavLinks current={current} className="hidden items-center gap-9 md:flex" />
        <PillLink href={action.href} tone="lime" className="h-9">
          {action.label}
        </PillLink>
      </div>
      <SiteNavLinks
        current={current}
        className="flex flex-wrap items-center gap-x-6 gap-y-2 md:hidden"
      />
    </header>
  )
}
