'use client'

import { usePathname } from 'next/navigation'
import type { JSX } from 'react'

import { type BrandOption } from './brand-switcher'
import { MobileNav } from './mobile-nav'
import { brandFromPathname } from './nav-config'
import { NavPanel } from './nav-panel'
import { NavRail } from './nav-rail'

interface SidebarProps {
  email: string
  brands: BrandOption[]
  fallbackBrand: string | null
  canManageBrands: boolean
  // The caller's permission keys, used to hide nav areas they cannot access.
  permissions: string[]
}

/**
 * The double sidebar: an icon rail of top-level areas plus a panel of the active
 * area's sub-items. Areas are scoped to the active brand (from the URL, or the
 * cookie fallback on workspace pages).
 *
 * Both columns are hidden below lg, where MobileNav takes over with a top bar
 * and a drawer. All three read the same nav-config, so an area added there
 * appears on every size without being listed twice.
 */
export function Sidebar({
  email,
  brands,
  fallbackBrand,
  canManageBrands,
  permissions,
}: SidebarProps): JSX.Element {
  const pathname = usePathname()
  const activeBrand = brandFromPathname(pathname) ?? fallbackBrand
  const base = activeBrand ? `/dashboard/${activeBrand}` : '/dashboard'

  return (
    <>
      <MobileNav
        base={base}
        brands={brands}
        activeSlug={activeBrand}
        email={email}
        canManageBrands={canManageBrands}
        permissions={permissions}
      />
      <NavRail base={base} permissions={permissions} />
      <NavPanel
        base={base}
        brands={brands}
        activeSlug={activeBrand}
        email={email}
        canManageBrands={canManageBrands}
        permissions={permissions}
      />
    </>
  )
}
