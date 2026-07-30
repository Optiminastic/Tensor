'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { JSX } from 'react'

import { SignOutButton } from '@/components/dashboard/sign-out-button'
import { cn } from '@/lib/utils'

import { type BrandOption, BrandSwitcher } from './brand-switcher'
import {
  isLeafActive,
  type NavLeaf,
  PRIMARY_SECTIONS,
  primarySegment,
  WORKSPACE_SECTIONS,
} from './nav-config'

interface NavPanelProps {
  base: string
  brands: BrandOption[]
  activeSlug: string | null
  email: string
}

interface ActiveSection {
  label: string
  description?: string
  items?: NavLeaf[]
}

function resolveActiveSection(pathname: string): ActiveSection {
  const segment = primarySegment(pathname)
  if (segment !== null) {
    const section = PRIMARY_SECTIONS.find(item => item.segment === segment) ?? PRIMARY_SECTIONS[0]
    return { label: section.label, description: section.description, items: section.items }
  }
  const workspace = WORKSPACE_SECTIONS.find(
    item => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )
  if (workspace) return { label: workspace.label, description: workspace.description }
  return { label: PRIMARY_SECTIONS[0].label, description: PRIMARY_SECTIONS[0].description }
}

/**
 * Column 2 of the double sidebar: the brand switcher, the active area's sub-items
 * (or a short description when it has none), and the signed-in user.
 */
export function NavPanel({ base, brands, activeSlug, email }: NavPanelProps): JSX.Element {
  const pathname = usePathname()
  const currentView = useSearchParams().get('view')
  const section = resolveActiveSection(pathname)

  return (
    <aside className="border-border bg-surface sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r lg:flex">
      {brands.length > 0 ? (
        <div className="border-border border-b p-3">
          <BrandSwitcher brands={brands} activeSlug={activeSlug} />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <p className="text-subtle-foreground px-2 pt-1 pb-2 text-xs font-medium tracking-wide uppercase">
          {section.label}
        </p>

        {section.items ? (
          section.items.map(item => {
            const href = `${base}${item.href}`
            const active = isLeafActive(pathname, currentView, href)
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-accent-subtle text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            )
          })
        ) : (
          <p className="text-muted-foreground px-2 text-sm text-pretty">{section.description}</p>
        )}
      </div>

      <div className="border-border flex flex-col gap-2 border-t px-4 py-3">
        <span className="text-subtle-foreground truncate text-xs" title={email}>
          {email}
        </span>
        <SignOutButton />
      </div>
    </aside>
  )
}
