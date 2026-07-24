'use client'

import { usePathname } from 'next/navigation'
import type { JSX } from 'react'

import { type BrandOption } from './brand-switcher'
import { brandFromPathname } from './nav-config'
import { NavPanel } from './nav-panel'
import { NavRail } from './nav-rail'

interface SidebarProps {
  email: string
  brands: BrandOption[]
  fallbackBrand: string | null
}

/**
 * The double sidebar: an icon rail of top-level areas plus a panel of the active
 * area's sub-items. Areas are scoped to the active brand (from the URL, or the
 * cookie fallback on workspace pages). Both columns are hidden below lg; a mobile
 * drawer is a follow-up.
 */
export function Sidebar({ email, brands, fallbackBrand }: SidebarProps): JSX.Element {
  const pathname = usePathname()
  const activeBrand = brandFromPathname(pathname) ?? fallbackBrand
  const base = activeBrand ? `/dashboard/${activeBrand}` : '/dashboard'

  return (
    <>
      <NavRail base={base} />
      <NavPanel base={base} brands={brands} activeSlug={activeBrand} email={email} />
    </>
  )
}
