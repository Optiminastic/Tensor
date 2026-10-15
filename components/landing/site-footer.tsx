import Link from 'next/link'
import type { JSX } from 'react'

import { Logo } from '@/components/logo'

const FOOTER_LINKS = [
  { href: '/product', label: 'Product' },
  { href: '/about', label: 'About' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/style-guide', label: 'Design system' },
]

/** A quiet ink footer, closing the page in the bento's darkest tone. */
export function SiteFooter(): JSX.Element {
  return (
    <footer className="p-2 sm:p-3">
      <div className="bg-landing-ink dark:ring-border flex flex-col gap-6 rounded-[1.75rem] px-6 py-8 text-white sm:flex-row sm:items-center sm:justify-between sm:px-10 dark:ring-1">
        <Logo className="text-white" />
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-7 gap-y-3 font-mono text-xs tracking-[0.18em] whitespace-nowrap uppercase"
        >
          {FOOTER_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white/75 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/login" className="text-white/75 transition-colors hover:text-white">
            Sign in
          </Link>
          <span className="text-white/75">Optiminastic</span>
        </nav>
      </div>
    </footer>
  )
}
