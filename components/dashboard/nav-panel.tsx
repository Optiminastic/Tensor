'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { type JSX, useState } from 'react'

import { NavSearch } from '@/components/dashboard/nav-search'
import { NAV_GROUP_LABEL, navItemClass } from '@/components/dashboard/nav-styles'
import { UserCard } from '@/components/dashboard/user-card'

import { type BrandOption, BrandSwitcher } from './brand-switcher'
import {
  type NavLeaf,
  PRIMARY_SECTIONS,
  primarySegment,
  resolveActiveHref,
  visibleItems,
  WORKSPACE_SECTIONS,
} from './nav-config'

interface NavPanelProps {
  base: string
  brands: BrandOption[]
  activeSlug: string | null
  email: string
  canManageBrands: boolean
  permissions: string[]
}

interface ActiveSection {
  label: string
  description?: string
  items?: NavLeaf[]
  // Workspace areas (Team, Settings) carry absolute hrefs; a primary area's
  // are brand-relative and get the brand base prefixed. Without this flag a
  // Settings row would resolve to /dashboard/<brand>/dashboard/settings.
  absolute?: boolean
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
  if (workspace) {
    return {
      label: workspace.label,
      description: workspace.description,
      items: workspace.items,
      absolute: true,
    }
  }
  return { label: PRIMARY_SECTIONS[0].label, description: PRIMARY_SECTIONS[0].description }
}

/**
 * Column 2 of the double sidebar: the brand switcher, the active area's sub-items
 * (or a short description when it has none), and the signed-in user.
 */
export function NavPanel({
  base,
  brands,
  activeSlug,
  email,
  canManageBrands,
  permissions,
}: NavPanelProps): JSX.Element {
  const pathname = usePathname()
  const currentView = useSearchParams().get('view')
  const section = resolveActiveSection(pathname)
  const [query, setQuery] = useState('')
  // Only the sub-items this user may access, so the panel never lists a screen
  // whose data the backend would refuse.
  const items = visibleItems(permissions, section.items)
  // One place decides how a leaf's href becomes a URL, so the panel and the
  // active-row resolver below cannot disagree about it.
  const hrefFor = (item: NavLeaf): string => (section.absolute ? item.href : `${base}${item.href}`)

  // No useMemo: React Compiler memoizes this, and a hand-written one here
  // stops it doing so for the whole component.
  const needle = query.trim().toLowerCase()
  const shown = needle ? items.filter(i => i.label.toLowerCase().includes(needle)) : items
  const activeHref =
    items.length > 0 ? resolveActiveHref(pathname, currentView, items.map(hrefFor)) : null

  return (
    <aside className="border-border/70 bg-surface sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r lg:flex">
      {brands.length > 0 ? (
        <div className="p-3">
          <BrandSwitcher
            brands={brands}
            activeSlug={activeSlug}
            canManageBrands={canManageBrands}
          />
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="px-3 pb-1">
          <NavSearch
            value={query}
            onChange={setQuery}
            label={`Filter ${section.label.toLowerCase()} pages`}
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {/*
         * Sentence case, not the mono-uppercase used elsewhere. A section
         * label here is a quiet grouping marker above its rows, not instrument
         * chrome - uppercase tracking makes it compete with the rows it is
         * meant to introduce.
         */}
        <p className={`${NAV_GROUP_LABEL} pt-1 pb-2`}>
          <span aria-hidden className="mr-2">
            •
          </span>
          {section.label}
        </p>

        {items.length > 0 ? (
          shown.map(item => {
            const href = hrefFor(item)
            const active = href === activeHref
            return (
              <Link
                key={item.href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={navItemClass(active)}
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                <span className="flex-1 truncate">{item.label}</span>
                {active ? (
                  <span aria-hidden className="bg-landing-ink size-1.5 rounded-full" />
                ) : null}
              </Link>
            )
          })
        ) : (
          <p className="text-muted-foreground px-2 text-sm text-pretty">{section.description}</p>
        )}

        {items.length > 0 && shown.length === 0 ? (
          <p className="text-muted-foreground px-3 py-2 text-sm">
            No page here matches “{query.trim()}”.
          </p>
        ) : null}
      </div>

      <div className="p-3">
        <UserCard email={email} />
      </div>
    </aside>
  )
}
