import Link from 'next/link'
import type { JSX } from 'react'

import { PillLink } from '@/components/landing/pill-link'
import { Logo } from '@/components/logo'

const NAV_LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#about', label: 'About' },
  { href: '#works-with', label: 'Integrations' },
  { href: '/style-guide', label: 'Design system' },
]

interface SiteHeaderProps {
  signedIn: boolean
}

/**
 * The nav that sits on the sky. Mono and uppercase, like the inspiration; the
 * links collapse below `md`, leaving the mark and the one action.
 *
 * The action is session-aware: a signed-in visitor gets "Dashboard" rather
 * than "Sign in", which would bounce them straight back here. UX only - every
 * real check happens in Tensor-Core.
 */
export function SiteHeader({ signedIn }: SiteHeaderProps): JSX.Element {
  const action = signedIn
    ? { href: '/dashboard', label: 'Dashboard' }
    : { href: '/login', label: 'Sign in' }

  return (
    <header className="relative z-10 flex items-center justify-between gap-6 px-5 py-5 sm:px-8">
      <Link href="/" aria-label="Tensor - home" className="rounded-sm text-white">
        <Logo className="text-white" />
      </Link>

      <nav aria-label="Main" className="hidden items-center gap-9 md:flex">
        {NAV_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-sm font-mono text-xs tracking-[0.18em] text-white/85 uppercase transition-colors hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <PillLink href={action.href} tone="lime" className="h-9">
        {action.label}
      </PillLink>
    </header>
  )
}
