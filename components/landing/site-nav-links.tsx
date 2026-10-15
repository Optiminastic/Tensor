import Link from 'next/link'
import type { JSX } from 'react'

import { cn } from '@/lib/utils'

export type SitePage = 'home' | 'product' | 'about' | 'integrations'

const NAV_LINKS: { href: string; label: string; page?: SitePage }[] = [
  { href: '/product', label: 'Product', page: 'product' },
  { href: '/about', label: 'About', page: 'about' },
  { href: '/integrations', label: 'Integrations', page: 'integrations' },
  { href: '/style-guide', label: 'Design system' },
]

interface SiteNavLinksProps {
  current?: SitePage
  className: string
}

/** The public site's page links, the current one underlined and marked aria-current. */
export function SiteNavLinks({ current, className }: SiteNavLinksProps): JSX.Element {
  return (
    <nav aria-label="Main" className={className}>
      {NAV_LINKS.map(link => {
        const active = link.page !== undefined && link.page === current
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-sm font-mono text-xs tracking-[0.18em] uppercase transition-colors hover:text-white',
              active ? 'text-white underline underline-offset-8' : 'text-white/85',
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
