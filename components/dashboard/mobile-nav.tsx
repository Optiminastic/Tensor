'use client'

import { Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState, type JSX } from 'react'

import { SignOutButton } from '@/components/dashboard/sign-out-button'
import { Logo } from '@/components/logo'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { type BrandOption, BrandSwitcher } from './brand-switcher'
import {
  type NavLeaf,
  type PrimarySection,
  resolveActiveHref,
  visibleItems,
  visiblePrimarySections,
  visibleWorkspaceSections,
} from './nav-config'

interface MobileNavProps {
  base: string
  brands: BrandOption[]
  activeSlug: string | null
  email: string
  canManageBrands: boolean
  permissions: string[]
}

/**
 * Navigation below `lg`, where the icon rail and the panel are both hidden.
 *
 * The desktop nav is two columns: pick an area in the rail, then a sub-item in
 * the panel. Reproducing that on a phone would mean two taps and a slide-over
 * inside a slide-over, so the drawer FLATTENS it - every area the user may see,
 * each with its sub-items listed underneath. It is a longer list, but it is one
 * scroll and one tap, and on a phone that is the better trade.
 *
 * An area with no sub-items (Integrations, Settings) is a link in its own
 * right; an area with them is a heading, because tapping "Production" and
 * landing on a page the heading did not name is the kind of thing that makes
 * people stop trusting a menu.
 */
export function MobileNav({
  base,
  brands,
  activeSlug,
  email,
  canManageBrands,
  permissions,
}: MobileNavProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const currentView = useSearchParams().get('view')
  const primary = visiblePrimarySections(permissions)
  const workspace = visibleWorkspaceSections(permissions)

  // Matched across every leaf of every area at once, not per-area: the same
  // longest-path rule the panel uses, so exactly one row is highlighted.
  const activeHref = resolveActiveHref(
    pathname,
    currentView,
    primary.flatMap(section =>
      visibleItems(permissions, section.items).map(i => `${base}${i.href}`),
    ),
  )

  const close = (): void => setOpen(false)

  return (
    <div className="border-border bg-surface sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b px-4 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open navigation"
            className="text-muted-foreground hover:bg-surface-muted hover:text-foreground -ml-2 flex size-10 items-center justify-center rounded-md transition-colors"
          >
            <Menu className="size-5" aria-hidden />
          </button>
        </SheetTrigger>

        <SheetContent side="left" className="gap-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>

          <div className="border-border flex h-14 shrink-0 items-center border-b px-4">
            <Link href="/dashboard" aria-label="Tensor" onClick={close}>
              <Logo markClassName="h-6" />
            </Link>
          </div>

          {brands.length > 0 ? (
            <div className="border-border border-b p-3">
              <BrandSwitcher
                brands={brands}
                activeSlug={activeSlug}
                canManageBrands={canManageBrands}
              />
            </div>
          ) : null}

          <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3">
            {primary.map(section => (
              <NavGroup
                key={section.label}
                section={section}
                base={base}
                permissions={permissions}
                activeHref={activeHref}
                onNavigate={close}
              />
            ))}

            <div className="border-border flex flex-col gap-0.5 border-t pt-3">
              {workspace.map(item => (
                <DrawerLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  onNavigate={close}
                />
              ))}
            </div>
          </nav>

          <div className="border-border flex shrink-0 flex-col gap-2 border-t px-4 py-3">
            <span className="text-subtle-foreground truncate text-xs" title={email}>
              {email}
            </span>
            <SignOutButton />
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/dashboard" aria-label="Tensor" className="flex items-center">
        <Logo markClassName="h-6" />
      </Link>
    </div>
  )
}

interface NavGroupProps {
  section: PrimarySection
  base: string
  permissions: string[]
  activeHref: string | null
  onNavigate: () => void
}

/** One area: a heading plus its sub-items, or a single link when it has none. */
function NavGroup({
  section,
  base,
  permissions,
  activeHref,
  onNavigate,
}: NavGroupProps): JSX.Element {
  const items: NavLeaf[] = visibleItems(permissions, section.items)
  const href = section.segment ? `${base}/${section.segment}` : base

  if (items.length === 0) {
    return (
      <DrawerLink
        href={href}
        label={section.label}
        active={activeHref === href}
        onNavigate={onNavigate}
      />
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-subtle-foreground px-3 pb-1 text-xs font-medium tracking-wide uppercase">
        {section.label}
      </p>
      {items.map(item => (
        <DrawerLink
          key={item.href}
          href={`${base}${item.href}`}
          label={item.label}
          active={activeHref === `${base}${item.href}`}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}

interface DrawerLinkProps {
  href: string
  label: string
  active: boolean
  onNavigate: () => void
}

/** A drawer row. min-h-10 rather than padding alone, so every row clears the
 * 40px touch target even when the label wraps to one short line. */
function DrawerLink({ href, label, active, onNavigate }: DrawerLinkProps): JSX.Element {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex min-h-10 items-center rounded-md px-3 text-sm transition-colors',
        active
          ? 'bg-accent-subtle text-foreground font-medium'
          : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
      )}
    >
      {label}
    </Link>
  )
}
