import { headers } from 'next/headers'
import Link from 'next/link'
import type { JSX } from 'react'

import { Logo } from '@/components/logo'
import { buttonVariants } from '@/components/ui/button'
import { auth } from '@/lib/auth'

const NAV_LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#pipeline', label: 'Pipeline' },
  { href: '#capabilities', label: 'Capabilities' },
  { href: '/style-guide', label: 'Design system' },
]

/**
 * Sticky masthead. The nav is mono and uppercase so it reads as instrument
 * chrome rather than prose, and collapses to just the mark and the primary
 * action below `md` — there is no hamburger to hide four anchors behind.
 *
 * The action is session-aware: a signed-out visitor gets "Sign in", a signed-in
 * one gets "Dashboard". Without this, someone who has already logged in still
 * sees "Sign in", clicks it, and middleware bounces them back to the landing
 * page — a loop that reads as "login did nothing". This is UX only; every real
 * check happens in Tensor-Core.
 */
export async function SiteHeader(): Promise<JSX.Element> {
  const session = await auth.api.getSession({ headers: await headers() })
  const action = session
    ? { href: '/dashboard', label: 'Dashboard' }
    : { href: '/login', label: 'Sign in' }

  return (
    <header className="border-border bg-background/85 sticky top-0 z-20 border-b backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-3.5 sm:px-6">
        <Link href="/" aria-label="Tensor — home" className="rounded-sm">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-subtle-foreground hover:text-foreground rounded-sm font-mono text-xs tracking-widest uppercase transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link href={action.href} className={buttonVariants({ variant: 'primary', size: 'sm' })}>
          {action.label}
        </Link>
      </div>
    </header>
  )
}
